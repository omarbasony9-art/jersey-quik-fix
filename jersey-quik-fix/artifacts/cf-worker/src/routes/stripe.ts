import type { Hono } from "hono";
import type { Env } from "../types";
import Stripe from "stripe";

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
  price: number;
  category: string | null;
}

export function registerStripe(app: Hono<{ Bindings: Env }>) {
  // POST /api/stripe/checkout — create Checkout Session from cart items
  app.post("/api/stripe/checkout", async (c) => {
    let body: {
      items: CartItem[];
      customerEmail?: string;
      promoCode?: string;
    };

    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "Invalid checkout request" }, 400);
    }

    const { items, customerEmail, promoCode } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return c.json({ error: "Cart is empty" }, 400);
    }

    const baseUrl =
      c.env.FRONTEND_URL ?? "https://jersey-quik-fix.workers.dev";

    const hasMembership = items.some(
      (i) =>
        i.name?.toLowerCase().includes("jqf+") ||
        i.name?.toLowerCase().includes("jqf plus") ||
        i.name?.toLowerCase().includes("membership"),
    );

    // Validate promo code
    let discountPercent = 0;
    if (promoCode) {
      try {
        const row = await c.env.DB.prepare(
          "SELECT discount_percent, is_active FROM membership_codes WHERE code = ?",
        )
          .bind(promoCode.toUpperCase().trim())
          .first<{ discount_percent: number; is_active: number }>();
        if (row && row.is_active) discountPercent = row.discount_percent;
      } catch {
        // Non-fatal
      }
    }

    const toStripeImageUrl = (image?: string): string | undefined => {
      if (!image) return undefined;
      try {
        const url = new URL(image);
        return url.protocol === "https:" ? url.toString() : undefined;
      } catch {
        return undefined;
      }
    };

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

          const product = await c.env.DB.prepare(
            `SELECT id, name, price, category
             FROM products
             WHERE id = ? AND active = 1
             LIMIT 1`,
          )
            .bind(item.productId)
            .first<CatalogProduct>();
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

      const stripe = new Stripe(c.env.STRIPE_SECRET_KEY);

      const lineItems = catalogItems.map((item) => {
        const discountedCents =
          discountPercent > 0
            ? Math.round(item.unitAmount * (1 - discountPercent / 100))
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
        success_url:
          `${baseUrl}/shop?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/shop?checkout=cancelled`,
        shipping_address_collection: { allowed_countries: ["US"] },
        ...(customerEmail ? { customer_email: customerEmail } : {}),
        metadata: {
          hasMembership: hasMembership ? "true" : "false",
          customerEmail: customerEmail ?? "",
          promoCode: promoCode ?? "",
          discountApplied: discountPercent.toString(),
        },
      });

      return c.json({ url: session.url, hasMembership, discountApplied: discountPercent });
    } catch (err: unknown) {
      console.error("POST /api/stripe/checkout failed", {
        message: err instanceof Error ? err.message : "Unknown error",
        itemCount: items.length,
      });
      return c.json({ error: "Failed to create checkout session" }, 500);
    }
  });

  // POST /api/stripe/webhook — receive Stripe events
  // Reads raw body as text for signature verification (stripe-replit-sync replaced
  // with standard stripe.webhooks.constructEvent).
  app.post("/api/stripe/webhook", async (c) => {
    const rawBody = await c.req.text();
    const sig = c.req.header("stripe-signature");

    if (!sig) return c.json({ error: "Missing stripe-signature" }, 400);

    try {
      const stripe = new Stripe(c.env.STRIPE_SECRET_KEY);
      // constructEventAsync is the Workers-compatible variant (no Node Buffer)
      const event = await stripe.webhooks.constructEventAsync(
        rawBody,
        sig,
        c.env.STRIPE_WEBHOOK_SECRET,
      );

      // Handle events relevant to membership activation, etc.
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(
          `Checkout completed: ${session.id}, hasMembership: ${session.metadata?.hasMembership}`,
        );
        // Membership code is issued on-demand via /api/membership/activate,
        // so no additional action is required here.
      }

      return c.json({ received: true });
    } catch (err: unknown) {
      console.error(
        "Stripe webhook error:",
        err instanceof Error ? err.message : err,
      );
      return c.json({ error: "Webhook processing error" }, 400);
    }
  });
}
