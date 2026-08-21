import { Router } from "express";
import { getUncachableStripeClient } from "../stripeClient";
import { db, membershipCodesTable, pool } from "@workspace/db";
import { eq } from "drizzle-orm";

const stripeCheckoutRouter = Router();

interface CartItem {
  productId: string;
  name: string;
  quantity: number;
  image?: string;
  category?: string;
}

interface CatalogProduct {
  id: string;
  name: string;
  price: number | string;
  category: string | null;
}

// POST /api/stripe/checkout — create a Stripe Checkout Session from cart items
stripeCheckoutRouter.post("/stripe/checkout", async (req, res): Promise<void> => {
  const {
    items,
    customerEmail,
    promoCode,
  }: {
    items: CartItem[];
    customerEmail?: string;
    promoCode?: string;
  } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: "Cart is empty" });
    return;
  }

  const baseUrl =
    process.env.FRONTEND_URL ||
    `${req.protocol}://${req.get("host")}`;

  const toStripeImageUrl = (image?: string): string | undefined => {
    if (!image) return undefined;

    try {
      const url = new URL(image);
      return url.protocol === "https:" ? url.toString() : undefined;
    } catch {
      return undefined;
    }
  };

  // Check if this cart includes a JQF+ membership
  const hasMembership = items.some(
    (i) =>
      i.name?.toLowerCase().includes("jqf+") ||
      i.name?.toLowerCase().includes("jqf plus") ||
      i.name?.toLowerCase().includes("membership"),
  );

  // Validate promo code if provided
  let discountPercent = 0;

  if (promoCode) {
    try {
      const codeRows = await db
        .select()
        .from(membershipCodesTable)
        .where(
          eq(
            membershipCodesTable.code,
            promoCode.toUpperCase().trim(),
          ),
        );

      if (codeRows.length > 0 && codeRows[0].isActive) {
        discountPercent = codeRows[0].discountPercent;
      }
    } catch {
      // Non-fatal — proceed without discount
    }
  }

  try {
    const catalogItems = await Promise.all(
      items.map(async (item) => {
        if (
          typeof item.productId !== "string" ||
          !item.productId ||
          !Number.isInteger(item.quantity) ||
          item.quantity < 1 ||
          item.quantity > 100
        ) {
          throw new Error("Invalid cart item");
        }

        const result = await pool.query<CatalogProduct>(
          `SELECT id, name, price, category
           FROM products
           WHERE id = $1 AND active = TRUE
           LIMIT 1`,
          [item.productId],
        );
        const product = result.rows[0];
        const price = Number(product?.price);

        if (!product || !Number.isFinite(price) || price < 0) {
          throw new Error(`Catalog product unavailable: ${item.productId}`);
        }

        return {
          name: product.name,
          category: product.category ?? undefined,
          quantity: item.quantity,
          image: toStripeImageUrl(item.image),
          unitAmount: Math.round(price * 100),
        };
      }),
    );

    const stripe = await getUncachableStripeClient();

    const lineItems = catalogItems.map((item) => {
      const discountedCents =
        discountPercent > 0
          ? Math.round(
              item.unitAmount * (1 - discountPercent / 100),
            )
          : item.unitAmount;

      return {
        price_data: {
          currency: "usd",
          unit_amount: discountedCents,
          product_data: {
            name:
              discountPercent > 0
                ? `${item.name} (${discountPercent}% JQF+ discount)`
                : item.name,
            ...(item.category
              ? { description: item.category }
              : {}),
            ...(item.image
              ? { images: [item.image] }
              : {}),
          },
        },
        quantity: item.quantity,
      };
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",

      success_url:
        `${baseUrl}/shop` +
        `?checkout=success&session_id={CHECKOUT_SESSION_ID}`,

      cancel_url:
        `${baseUrl}/shop?checkout=cancelled`,

      shipping_address_collection: {
        allowed_countries: ["US"],
      },

      ...(customerEmail
        ? { customer_email: customerEmail }
        : {}),

      metadata: {
        hasMembership: hasMembership ? "true" : "false",
        customerEmail: customerEmail || "",
        promoCode: promoCode || "",
        discountApplied: discountPercent.toString(),
      },
    });

    res.json({
      url: session.url,
      hasMembership,
      discountApplied: discountPercent,
    });
  } catch (err: any) {
    console.error("POST /api/stripe/checkout failed", {
      message: err instanceof Error ? err.message : "Unknown error",
      itemCount: items.length,
    });

    res.status(500).json({
      error: "Failed to create checkout session",
    });
  }
});

export default stripeCheckoutRouter;