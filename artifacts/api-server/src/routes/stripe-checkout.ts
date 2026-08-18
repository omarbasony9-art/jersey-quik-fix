/**
 * stripe-checkout.ts — Secure server-side Stripe Checkout
 *
 * SECURITY: Prices are NEVER trusted from the client.
 * The server looks up every product in the DB, validates stock atomically,
 * checks verified status, and builds line items from server-side prices only.
 *
 * Inventory contract:
 *   - inventory.quantity is decremented atomically BEFORE the Stripe session is
 *     created (using a conditional UPDATE so two concurrent checkouts cannot
 *     both succeed for the last unit).
 *   - If Stripe session creation fails the decrement is rolled back.
 *   - The webhook does NOT decrement inventory again — it only records the order.
 */
import { Router } from "express";
import { pool } from "@workspace/db";
import { getUncachableStripeClient } from "../stripeClient";

const stripeCheckoutRouter = Router();

interface CartInput {
  productId: string;
  quantity: number;
  storage?: string;
  color?: string;
  condition?: string;
  ram?: string;
}

// POST /api/stripe/checkout
stripeCheckoutRouter.post("/stripe/checkout", async (req, res): Promise<void> => {
  const { items }: { items: CartInput[] } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: "Cart is empty" });
    return;
  }

  // ── 1. Validate inputs and aggregate duplicate variant rows ────────────────
  const aggregated = new Map<string, CartInput>();
  for (const item of items) {
    const qty = Number(item.quantity);
    if (!Number.isInteger(qty) || qty < 1) {
      res.status(400).json({ error: "Quantity must be a positive integer" });
      return;
    }
    const key = [
      item.productId,
      item.storage   ?? "",
      item.color     ?? "",
      item.condition ?? "",
      item.ram       ?? "",
    ].join("|");
    const existing = aggregated.get(key);
    if (existing) {
      existing.quantity += qty;
    } else {
      aggregated.set(key, { ...item, quantity: qty });
    }
  }
  const deduped = Array.from(aggregated.values());

  // ── 2. Fetch products from DB ──────────────────────────────────────────────
  const ids          = [...new Set(deduped.map((i) => i.productId))];
  const placeholders = ids.map((_, i) => `$${i + 1}`).join(",");

  let products: any[];
  try {
    const result = await pool.query(
      `SELECT p.id, p.name, p.price, p.images, p.active, p.verified,
              p.category, p.configuration,
              COALESCE(i.quantity, 0) AS stock
       FROM products p
       LEFT JOIN inventory i ON i.product_id = p.id
       WHERE p.id IN (${placeholders})`,
      ids
    );
    products = result.rows;
  } catch (err) {
    console.error("Stripe checkout — DB lookup error:", err);
    res.status(500).json({ error: "Failed to validate cart" });
    return;
  }

  const productMap = new Map(products.map((p) => [p.id, p]));
  const lineItems: any[] = [];
  const cartMeta: { id: string; qty: number; storage?: string; color?: string; condition?: string; ram?: string }[] = [];

  // ── 3. Validate each item and compute server-side price ────────────────────
  for (const item of deduped) {
    const p = productMap.get(item.productId);
    if (!p) {
      res.status(400).json({ error: `Product not found: ${item.productId}` });
      return;
    }
    if (!p.active) {
      res.status(400).json({ error: `Product unavailable: ${p.name}` });
      return;
    }
    // Enforce verified policy — same gate as the disabled "Add to Cart" button
    if (!p.verified) {
      res.status(400).json({ error: `"${p.name}" is not yet available for purchase — please check back soon.` });
      return;
    }

    // Server-side price: base (dollars) + variant deltas
    let unitPrice = Number(p.price); // DB stores dollars
    if (item.storage   && p.configuration?.pricingByStorage?.[item.storage]   != null) unitPrice += Number(p.configuration.pricingByStorage[item.storage]);
    if (item.condition && p.configuration?.conditionPricing?.[item.condition]  != null) unitPrice += Number(p.configuration.conditionPricing[item.condition]);
    if (item.ram       && p.configuration?.pricingByRam?.[item.ram]            != null) unitPrice += Number(p.configuration.pricingByRam[item.ram]);

    const image        = Array.isArray(p.images) && p.images[0] ? p.images[0] : undefined;
    const variantLabel = [item.storage, item.color, item.ram, item.condition].filter(Boolean).join(" · ");
    const productName  = variantLabel ? `${p.name} — ${variantLabel}` : p.name;

    lineItems.push({
      price_data: {
        currency: "usd",
        unit_amount: Math.round(unitPrice * 100),
        product_data: {
          name: productName,
          description: p.category ?? undefined,
          metadata: { productId: p.id },
          ...(image && image.startsWith("http") ? { images: [image] } : {}),
        },
      },
      quantity: item.quantity,
    });

    cartMeta.push({ id: item.productId, qty: item.quantity, storage: item.storage, color: item.color, condition: item.condition, ram: item.ram });
  }

  // ── 4. Atomically reserve inventory (conditional decrement) ────────────────
  // Uses a DB transaction so two concurrent checkouts cannot both succeed for
  // the same last unit. Pickup-only items (arcade machines) skip this check.
  const reservedItems: { productId: string; quantity: number }[] = [];
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const item of deduped) {
      const p = productMap.get(item.productId)!;
      if (p.configuration?.pickupOnly) continue;

      const upd = await client.query(
        `UPDATE inventory
         SET quantity = quantity - $1, updated_at = NOW()
         WHERE product_id = $2 AND quantity >= $1
         RETURNING product_id`,
        [item.quantity, item.productId]
      );
      if (upd.rows.length === 0) {
        await client.query("ROLLBACK");
        client.release();
        const avail = Number(p.stock);
        res.status(400).json({
          error: `"${p.name}" ${avail > 0 ? `only has ${avail} unit(s) available` : "is out of stock"} (requested ${item.quantity})`,
        });
        return;
      }
      reservedItems.push({ productId: item.productId, quantity: item.quantity });
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    client.release();
    console.error("Stripe checkout — inventory reservation error:", err);
    res.status(500).json({ error: "Failed to reserve inventory" });
    return;
  }
  client.release();

  // ── 5. Create Stripe Checkout session ──────────────────────────────────────
  const domain  = process.env.REPLIT_DOMAINS?.split(",")[0];
  const baseUrl = domain ? `https://${domain}` : "http://localhost:3000";

  try {
    const stripe  = await getUncachableStripeClient();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${baseUrl}/shop?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${baseUrl}/shop?checkout=cancelled`,
      shipping_address_collection: { allowed_countries: ["US"] },
      metadata: {
        cart: JSON.stringify(cartMeta).slice(0, 490),
      },
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (err: any) {
    // Stripe failed — release the inventory reservation so items aren't stuck
    console.error("Stripe checkout error:", err.message);
    for (const r of reservedItems) {
      await pool
        .query("UPDATE inventory SET quantity = quantity + $1, updated_at = NOW() WHERE product_id = $2", [r.quantity, r.productId])
        .catch((e) => console.error("Failed to release inventory reservation:", e));
    }
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

export default stripeCheckoutRouter;
