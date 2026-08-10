import { Router } from "express";
import { getUncachableStripeClient } from "../stripeClient";
import { db, membershipCodesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const stripeCheckoutRouter = Router();

interface CartItem {
  name: string;
  price: number;   // in dollars
  quantity: number;
  image?: string;
  category?: string;
}

// POST /api/stripe/checkout — create a Stripe Checkout Session from cart items
stripeCheckoutRouter.post("/stripe/checkout", async (req, res): Promise<void> => {
  const {
    items,
    customerEmail,
    promoCode,
  }: { items: CartItem[]; customerEmail?: string; promoCode?: string } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: "Cart is empty" });
    return;
  }

  const domain = process.env.REPLIT_DOMAINS?.split(",")[0];
  const baseUrl = domain ? `https://${domain}` : "http://localhost:3000";

  // Check if this cart includes a JQF+ membership
  const hasMembership = items.some(i =>
    i.name?.toLowerCase().includes("jqf+") ||
    i.name?.toLowerCase().includes("jqf plus") ||
    i.name?.toLowerCase().includes("membership")
  );

  // Validate promo code if provided
  let discountPercent = 0;
  if (promoCode) {
    try {
      const codeRows = await db
        .select()
        .from(membershipCodesTable)
        .where(eq(membershipCodesTable.code, promoCode.toUpperCase().trim()));
      if (codeRows.length > 0 && codeRows[0].isActive) {
        discountPercent = codeRows[0].discountPercent;
      }
    } catch {
      // Non-fatal — proceed without discount
    }
  }

  try {
    const stripe = await getUncachableStripeClient();

    // Apply discount to each item if promo code is valid
    const lineItems = items.map((item) => {
      const originalCents = Math.round(item.price * 100);
      const discountedCents =
        discountPercent > 0
          ? Math.round(originalCents * (1 - discountPercent / 100))
          : originalCents;

      return {
        price_data: {
          currency: "usd",
          unit_amount: discountedCents,
          product_data: {
            name:
              discountPercent > 0
                ? `${item.name} (${discountPercent}% JQF+ discount)`
                : item.name,
            ...(item.category ? { description: item.category } : {}),
            ...(item.image ? { images: [item.image] } : {}),
          },
        },
        quantity: item.quantity,
      };
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${baseUrl}/shop?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/shop?checkout=cancelled`,
      shipping_address_collection: { allowed_countries: ["US"] },
      ...(customerEmail ? { customer_email: customerEmail } : {}),
      metadata: {
        hasMembership: hasMembership ? "true" : "false",
        customerEmail: customerEmail || "",
        promoCode: promoCode || "",
        discountApplied: discountPercent.toString(),
      },
    });

    res.json({ url: session.url, hasMembership, discountApplied: discountPercent });
  } catch (err: any) {
    console.error("Stripe checkout error:", err.message);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

export default stripeCheckoutRouter;
