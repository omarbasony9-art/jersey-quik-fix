/**
 * Admin product routes (require valid admin token).
 *
 * GET    /api/admin/products       — list all, prices in CENTS
 * POST   /api/admin/products       — create product (price input in cents)
 * PATCH  /api/admin/products/:id   — update product (price input in cents)
 *
 * Price convention:
 *   • D1 stores prices in DOLLARS (REAL).
 *   • Admin API receives and returns prices in CENTS so the admin UI
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
  description: string;
  price: number;       // dollars in D1
  images: string;      // JSON
  in_stock: number;
  featured: number;
  created_at: string;
  updated_at: string;
}

// Normalise a DB row → admin API shape (price in cents)
function formatAdmin(row: ProductRow) {
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    category: row.category,
    description: row.description,
    price: Math.round(row.price * 100),          // dollars → cents
    images: JSON.parse(row.images || "[]"),
    inStock: row.in_stock === 1,
    featured: row.featured === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function requireAdmin(c: { req: { header: (k: string) => string | undefined }; json: (b: unknown, s: number) => Response }, secret: string): Promise<boolean> {
  const auth = c.req.header("authorization") || c.req.header("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : auth;
  if (!token) return false;
  return verifyAdminToken(token, secret);
}

export function registerAdminProducts(app: Hono<{ Bindings: Env }>) {
  // ── List all products ───────────────────────────────────────────────────────
  app.get("/api/admin/products", async (c) => {
    if (!(await requireAdmin(c as never, c.env.SESSION_SECRET))) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    try {
      const result = await c.env.DB.prepare(
        "SELECT * FROM products ORDER BY name ASC"
      ).all<ProductRow>();
      return c.json({ products: (result.results || []).map(formatAdmin) });
    } catch (err) {
      console.error("GET /api/admin/products error:", err);
      return c.json({ error: "Failed to load products" }, 500);
    }
  });

  // ── Create product ──────────────────────────────────────────────────────────
  app.post("/api/admin/products", async (c) => {
    if (!(await requireAdmin(c as never, c.env.SESSION_SECRET))) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    try {
      const body = await c.req.json<{
        name: string;
        sku: string;
        category?: string;
        description?: string;
        price: number;       // cents
        images?: string[];
        inStock?: boolean;
        featured?: boolean;
      }>();

      if (!body.name || !body.sku || body.price == null) {
        return c.json({ error: "name, sku, and price are required" }, 400);
      }

      const id = crypto.randomUUID();
      const priceInDollars = body.price / 100;
      const imagesJson = JSON.stringify(body.images || []);
      const now = new Date().toISOString();

      await c.env.DB.prepare(`
        INSERT INTO products (id, name, sku, category, description, price, images, in_stock, featured, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        body.name,
        body.sku,
        body.category || "",
        body.description || "",
        priceInDollars,
        imagesJson,
        body.inStock === false ? 0 : 1,
        body.featured ? 1 : 0,
        now,
        now,
      ).run();

      const row = await c.env.DB.prepare("SELECT * FROM products WHERE id = ?")
        .bind(id)
        .first<ProductRow>();

      if (!row) return c.json({ error: "Insert failed" }, 500);
      // Return normalised product directly (matches Express API shape)
      return c.json(formatAdmin(row), 201);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("UNIQUE constraint") || msg.includes("SQLITE_CONSTRAINT")) {
        return c.json({ error: "A product with that SKU already exists" }, 409);
      }
      console.error("POST /api/admin/products error:", err);
      return c.json({ error: "Failed to create product" }, 500);
    }
  });

  // ── Update product ──────────────────────────────────────────────────────────
  app.patch("/api/admin/products/:id", async (c) => {
    if (!(await requireAdmin(c as never, c.env.SESSION_SECRET))) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    try {
      const id = c.req.param("id");
      const body = await c.req.json<{
        name?: string;
        sku?: string;
        category?: string;
        description?: string;
        price?: number;      // cents
        images?: string[];
        inStock?: boolean;
        featured?: boolean;
      }>();

      const existing = await c.env.DB.prepare(
        "SELECT * FROM products WHERE id = ?"
      ).bind(id).first<ProductRow>();

      if (!existing) return c.json({ error: "Product not found" }, 404);

      // Merge patch fields
      const name        = body.name        ?? existing.name;
      const sku         = body.sku         ?? existing.sku;
      const category    = body.category    ?? existing.category;
      const description = body.description ?? existing.description;
      const price       = body.price != null
        ? body.price / 100                         // cents → dollars
        : existing.price;
      // NOTE: images are NOT deleted from R2 here — only the URL list is updated.
      // Actual R2 deletion happens only via DELETE /api/admin/product-images/:filename.
      const images      = body.images  != null
        ? JSON.stringify(body.images)
        : existing.images;
      const inStock     = body.inStock  != null ? (body.inStock  ? 1 : 0) : existing.in_stock;
      const featured    = body.featured != null ? (body.featured ? 1 : 0) : existing.featured;
      const now         = new Date().toISOString();

      await c.env.DB.prepare(`
        UPDATE products
        SET name = ?, sku = ?, category = ?, description = ?, price = ?,
            images = ?, in_stock = ?, featured = ?, updated_at = ?
        WHERE id = ?
      `).bind(name, sku, category, description, price, images, inStock, featured, now, id).run();

      const updated = await c.env.DB.prepare("SELECT * FROM products WHERE id = ?")
        .bind(id)
        .first<ProductRow>();

      if (!updated) return c.json({ error: "Update failed" }, 500);
      return c.json({ product: formatAdmin(updated) });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("UNIQUE constraint") || msg.includes("SQLITE_CONSTRAINT")) {
        return c.json({ error: "A product with that SKU already exists" }, 409);
      }
      console.error("PATCH /api/admin/products/:id error:", err);
      return c.json({ error: "Failed to update product" }, 500);
    }
  });

  // ── Delete product ──────────────────────────────────────────────────────────
  app.delete("/api/admin/products/:id", async (c) => {
    if (!(await requireAdmin(c as never, c.env.SESSION_SECRET))) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    try {
      const id = c.req.param("id");
      const existing = await c.env.DB.prepare(
        "SELECT id FROM products WHERE id = ?"
      ).bind(id).first<{ id: string }>();

      if (!existing) return c.json({ error: "Product not found" }, 404);

      await c.env.DB.prepare("DELETE FROM products WHERE id = ?").bind(id).run();
      return c.json({ success: true });
    } catch (err) {
      console.error("DELETE /api/admin/products/:id error:", err);
      return c.json({ error: "Failed to delete product" }, 500);
    }
  });
}
