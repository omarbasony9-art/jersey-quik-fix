/**
 * Admin product routes (require valid admin token).
 *
 * GET    /api/admin/products       — list all (prices in CENTS for admin UI)
 * POST   /api/admin/products       — create product (price in cents)
 * PATCH  /api/admin/products/:id   — update product (price in cents)
 * DELETE /api/admin/products/:id   — delete product
 *
 * Price convention:
 *   • D1 stores prices in DOLLARS (REAL).
 *   • Admin API receives and returns prices in CENTS so the AdminPage
 *     (which mirrors the Express API shape) works unchanged.
 */

import type { Hono } from "hono";
import type { Env } from "../types";
import { verifyAdminToken } from "../lib/adminToken";

interface ProductRow {
  id: string;
  name: string;
  sku: string;
  category: string;
  subcategory: string | null;
  description: string;
  price: number;
  old_price: number | null;
  price_note: string | null;
  condition: string | null;
  stock: number;
  images: string;
  badge: string | null;
  rating: number | null;
  active: number;
  featured: number;
  verified: number;
  verification_note: string | null;
  created_at: string;
  updated_at: string;
}

function formatAdmin(row: ProductRow) {
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    category: row.category,
    subcategory: row.subcategory ?? undefined,
    description: row.description,
    price: Math.round(row.price * 100),              // dollars → cents
    old_price: row.old_price != null
      ? Math.round(row.old_price * 100)
      : undefined,
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

async function requireAdmin(
  authHeader: string | undefined,
  secret: string,
): Promise<boolean> {
  const raw = authHeader || "";
  const token = raw.startsWith("Bearer ") ? raw.slice(7) : raw;
  if (!token) return false;
  return verifyAdminToken(token, secret);
}

export function registerAdminProducts(app: Hono<{ Bindings: Env }>) {
  // ── List all products ───────────────────────────────────────────────────────
  app.get("/api/admin/products", async (c) => {
    if (!(await requireAdmin(c.req.header("authorization"), c.env.SESSION_SECRET))) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    try {
      const result = await c.env.DB.prepare(
        "SELECT * FROM products ORDER BY name ASC",
      ).all<ProductRow>();
      return c.json({ products: (result.results || []).map(formatAdmin) });
    } catch (err) {
      console.error("GET /api/admin/products error:", err);
      return c.json({ error: "Failed to load products" }, 500);
    }
  });

  // ── Create product ──────────────────────────────────────────────────────────
  app.post("/api/admin/products", async (c) => {
    if (!(await requireAdmin(c.req.header("authorization"), c.env.SESSION_SECRET))) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    try {
      const body = await c.req.json<{
        name: string;
        sku: string;
        category?: string;
        subcategory?: string;
        description?: string;
        price: number;       // cents
        old_price?: number;  // cents
        price_note?: string;
        condition?: string;
        stock?: number;
        images?: string[];
        badge?: string;
        rating?: number;
        active?: boolean;
        featured?: boolean;
      }>();

      if (!body.name || !body.sku || body.price == null) {
        return c.json({ error: "name, sku, and price are required" }, 400);
      }

      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      await c.env.DB.prepare(`
        INSERT INTO products
          (id, name, sku, category, subcategory, description, price, old_price,
           price_note, condition, stock, images, badge, rating, active, featured,
           created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        body.name,
        body.sku,
        body.category || "",
        body.subcategory ?? null,
        body.description || "",
        body.price / 100,                             // cents → dollars
        body.old_price != null ? body.old_price / 100 : null,
        body.price_note ?? null,
        body.condition ?? null,
        body.stock ?? 1,
        JSON.stringify(body.images || []),
        body.badge ?? null,
        body.rating ?? null,
        body.active === false ? 0 : 1,
        body.featured ? 1 : 0,
        now,
        now,
      ).run();

      const row = await c.env.DB.prepare(
        "SELECT * FROM products WHERE id = ?",
      ).bind(id).first<ProductRow>();

      if (!row) return c.json({ error: "Insert failed" }, 500);
      return c.json(formatAdmin(row), 201);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes("UNIQUE constraint") ||
        msg.includes("SQLITE_CONSTRAINT")
      ) {
        return c.json({ error: "A product with that SKU already exists" }, 409);
      }
      console.error("POST /api/admin/products error:", err);
      return c.json({ error: "Failed to create product" }, 500);
    }
  });

  // ── Update product ──────────────────────────────────────────────────────────
  app.patch("/api/admin/products/:id", async (c) => {
    if (!(await requireAdmin(c.req.header("authorization"), c.env.SESSION_SECRET))) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    try {
      const id = c.req.param("id");
      const body = await c.req.json<{
        name?: string;
        sku?: string;
        category?: string;
        subcategory?: string;
        description?: string;
        price?: number;      // cents
        old_price?: number;  // cents
        price_note?: string;
        condition?: string;
        stock?: number;
        images?: string[];
        badge?: string;
        rating?: number;
        active?: boolean;
        featured?: boolean;
      }>();

      const existing = await c.env.DB.prepare(
        "SELECT * FROM products WHERE id = ?",
      ).bind(id).first<ProductRow>();

      if (!existing) return c.json({ error: "Product not found" }, 404);

      const name        = body.name        ?? existing.name;
      const sku         = body.sku         ?? existing.sku;
      const category    = body.category    ?? existing.category;
      const subcategory = body.subcategory !== undefined ? body.subcategory : existing.subcategory;
      const description = body.description ?? existing.description;
      const price       = body.price != null ? body.price / 100 : existing.price;
      const old_price   = body.old_price != null
        ? body.old_price / 100
        : (body.old_price === null ? null : existing.old_price);
      const price_note  = body.price_note  !== undefined ? body.price_note  : existing.price_note;
      const condition   = body.condition   !== undefined ? body.condition   : existing.condition;
      const stock       = body.stock       != null       ? body.stock       : existing.stock;
      // NOTE: images list updated but R2 objects are NOT deleted here.
      // Use DELETE /api/admin/product-images/:filename to remove R2 objects.
      const images      = body.images != null
        ? JSON.stringify(body.images)
        : existing.images;
      const badge       = body.badge   !== undefined ? body.badge   : existing.badge;
      const rating      = body.rating  != null       ? body.rating  : existing.rating;
      const active      = body.active  != null       ? (body.active  ? 1 : 0) : existing.active;
      const featured    = body.featured != null      ? (body.featured ? 1 : 0) : existing.featured;
      const now         = new Date().toISOString();

      await c.env.DB.prepare(`
        UPDATE products
        SET name = ?, sku = ?, category = ?, subcategory = ?, description = ?,
            price = ?, old_price = ?, price_note = ?, condition = ?, stock = ?,
            images = ?, badge = ?, rating = ?, active = ?, featured = ?,
            updated_at = ?
        WHERE id = ?
      `).bind(
        name, sku, category, subcategory, description,
        price, old_price, price_note, condition, stock,
        images, badge, rating, active, featured,
        now, id,
      ).run();

      const updated = await c.env.DB.prepare(
        "SELECT * FROM products WHERE id = ?",
      ).bind(id).first<ProductRow>();

      if (!updated) return c.json({ error: "Update failed" }, 500);
      return c.json({ product: formatAdmin(updated) });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes("UNIQUE constraint") ||
        msg.includes("SQLITE_CONSTRAINT")
      ) {
        return c.json({ error: "A product with that SKU already exists" }, 409);
      }
      console.error("PATCH /api/admin/products/:id error:", err);
      return c.json({ error: "Failed to update product" }, 500);
    }
  });

  // ── Delete product ──────────────────────────────────────────────────────────
  app.delete("/api/admin/products/:id", async (c) => {
    if (!(await requireAdmin(c.req.header("authorization"), c.env.SESSION_SECRET))) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    try {
      const id = c.req.param("id");
      const existing = await c.env.DB.prepare(
        "SELECT id FROM products WHERE id = ?",
      ).bind(id).first<{ id: string }>();

      if (!existing) return c.json({ error: "Product not found" }, 404);

      await c.env.DB.prepare("DELETE FROM products WHERE id = ?")
        .bind(id)
        .run();
      return c.json({ success: true });
    } catch (err) {
      console.error("DELETE /api/admin/products/:id error:", err);
      return c.json({ error: "Failed to delete product" }, 500);
    }
  });
}
