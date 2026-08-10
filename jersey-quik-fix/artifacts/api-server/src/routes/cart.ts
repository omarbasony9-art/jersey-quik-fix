import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { cartItems } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

const cartRouter = Router();

// Middleware — all cart routes require authentication
function requireAuth(req: any, res: any, next: any) {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
}

// GET /api/cart — load saved cart for signed-in user
cartRouter.get("/cart", requireAuth, async (req: any, res) => {
  try {
    const items = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.userId, req.userId));
    res.json({ items });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cart/sync — replace entire cart with provided items
cartRouter.post("/cart/sync", requireAuth, async (req: any, res) => {
  const { items } = req.body as {
    items: Array<{
      productId: string;
      productName: string;
      productCategory?: string;
      price: number;
      quantity: number;
      image?: string;
      sku?: string;
      badge?: string;
    }>;
  };

  if (!Array.isArray(items)) {
    return res.status(400).json({ error: "items must be an array" });
  }

  try {
    // Delete existing cart
    await db.delete(cartItems).where(eq(cartItems.userId, req.userId));

    // Insert new items
    if (items.length > 0) {
      await db.insert(cartItems).values(
        items.map((item) => ({
          userId: req.userId,
          productId: item.productId,
          productName: item.productName,
          productCategory: item.productCategory ?? null,
          price: String(item.price),
          quantity: item.quantity,
          image: item.image ?? null,
          sku: item.sku ?? null,
          badge: item.badge ?? null,
        }))
      );
    }

    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/cart — clear cart
cartRouter.delete("/cart", requireAuth, async (req: any, res) => {
  try {
    await db.delete(cartItems).where(eq(cartItems.userId, req.userId));
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default cartRouter;
