import { Router } from "express";
import { getUncachableStripeClient } from "../stripeClient";

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
  const { items }: { items: CartItem[] } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: "Cart is empty" });
    return;
  }

  const domain = process.env.REPLIT_DOMAINS?.split(",")[0];
  const baseUrl = domain ? `https://${domain}` : "http://localhost:3000";

  try {
    const stripe = await getUncachableStripeClient();

    const lineItems = items.map((item) => ({
      price_data: {
        currency: "usd",
        unit_amount: Math.round(item.price * 100), // convert to cents
        product_data: {
          name: item.name,
          ...(item.category ? { description: item.category } : {}),
          ...(item.image ? { images: [item.image] } : {}),
        },
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${baseUrl}/shop?checkout=success`,
      cancel_url: `${baseUrl}/shop?checkout=cancelled`,
      shipping_address_collection: { allowed_countries: ["US"] },
    });

    res.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe checkout error:", err.message);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

export default stripeCheckoutRouter;
