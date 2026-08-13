import type { Hono, Context } from "hono";
import type { Env } from "../types";
import { extractBearerToken, verifyClerkToken } from "../lib/clerkAuth";

/** Resolve the authenticated Clerk userId from the request, or return null. */
async function resolveUser(c: Context<{ Bindings: Env }>): Promise<string | null> {
  const token = extractBearerToken(c.req.header("Authorization") ?? null);
  if (!token) return null;
  return verifyClerkToken(token, c.env);
}

export function registerCart(app: Hono<{ Bindings: Env }>) {
  // GET /api/cart — Clerk-auth required
  app.get("/api/cart", async (c) => {
    const userId = await resolveUser(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const { results } = await c.env.DB.prepare(
      "SELECT * FROM cart_items WHERE user_id = ?",
    )
      .bind(userId)
      .all();
    return c.json({ items: results });
  });

  // POST /api/cart/sync — replace entire cart
  app.post("/api/cart/sync", async (c) => {
    const userId = await resolveUser(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const { items } = await c.req.json<{
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
    }>();
    if (!Array.isArray(items)) {
      return c.json({ error: "items must be an array" }, 400);
    }

    const now = new Date().toISOString();

    // Delete + re-insert (replace-all semantics)
    await c.env.DB.prepare("DELETE FROM cart_items WHERE user_id = ?")
      .bind(userId)
      .run();

    if (items.length > 0) {
      const stmt = c.env.DB.prepare(
        `INSERT INTO cart_items
           (user_id, product_id, product_name, product_category, price, quantity, image, sku, badge, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      );
      await c.env.DB.batch(
        items.map((item) =>
          stmt.bind(
            userId,
            item.productId,
            item.productName,
            item.productCategory ?? null,
            item.price,
            item.quantity,
            item.image ?? null,
            item.sku ?? null,
            item.badge ?? null,
            now,
            now,
          ),
        ),
      );
    }
    return c.json({ ok: true });
  });

  // DELETE /api/cart — clear cart
  app.delete("/api/cart", async (c) => {
    const userId = await resolveUser(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);
    await c.env.DB.prepare("DELETE FROM cart_items WHERE user_id = ?")
      .bind(userId)
      .run();
    return c.json({ ok: true });
  });
}
