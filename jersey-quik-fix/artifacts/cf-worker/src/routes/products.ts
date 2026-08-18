/**
 * Public product routes (no auth required).
 *
 * GET /api/products            — list active products (prices in dollars)
 * GET /api/products/:id        — single product by id or sku
 *
 * Response shape mirrors the Express API so ShopPage works unchanged.
 */

import type { Hono } from "hono";
import type { Env } from "../types";

interface ProductRow {
  id: string;
  name: string;
  sku: string;
  category: string;
  subcategory: string | null;
  description: string;
  price: number;          // dollars
  old_price: number | null;
  price_note: string | null;
  condition: string | null;
  stock: number;
  images: string;         // JSON array
  badge: string | null;
  rating: number | null;
  active: number;         // 0 | 1
  featured: number;       // 0 | 1
  verified: number;       // 0 | 1
  verification_note: string | null;
  created_at: string;
  updated_at: string;
}

function formatPublic(row: ProductRow) {
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    category: row.category,
    subcategory: row.subcategory ?? undefined,
    description: row.description,
    price: row.price,                                 // dollars — matches ShopPage parseFloat
    old_price: row.old_price ?? undefined,
    price_note: row.price_note ?? undefined,
    condition: row.condition ?? undefined,
    stock: row.stock,
    images: JSON.parse(row.images || "[]"),
    badge: row.badge ?? undefined,
    rating: row.rating ?? undefined,
    active: row.active === 1,
    featured: row.featured === 1,
    verified: row.verified === 1,
    verification_note: row.verification_note ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function registerProducts(app: Hono<{ Bindings: Env }>) {
  // ── List products ───────────────────────────────────────────────────────────
  app.get("/api/products", async (c) => {
    try {
      const url = new URL(c.req.url);
      const limit = Math.min(
        Number(url.searchParams.get("limit") || "200"),
        1000,
      );
      const category = url.searchParams.get("category");

      let query: string;
      let params: unknown[];

      if (category) {
        query =
          "SELECT * FROM products WHERE active = 1 AND category = ? ORDER BY name ASC LIMIT ?";
        params = [category, limit];
      } else {
        query =
          "SELECT * FROM products WHERE active = 1 ORDER BY name ASC LIMIT ?";
        params = [limit];
      }

      const result = await c.env.DB.prepare(query)
        .bind(...params)
        .all<ProductRow>();
      const products = (result.results || []).map(formatPublic);

      return c.json({ products });
    } catch (err) {
      console.error("GET /api/products error:", err);
      return c.json({ error: "Failed to load products" }, 500);
    }
  });

  // ── Single product ──────────────────────────────────────────────────────────
  app.get("/api/products/:id", async (c) => {
    try {
      const id = c.req.param("id");
      const row = await c.env.DB.prepare(
        "SELECT * FROM products WHERE id = ? OR sku = ? LIMIT 1",
      )
        .bind(id, id)
        .first<ProductRow>();

      if (!row) return c.json({ error: "Product not found" }, 404);
      return c.json({ product: formatPublic(row) });
    } catch (err) {
      console.error("GET /api/products/:id error:", err);
      return c.json({ error: "Failed to load product" }, 500);
    }
  });
}
