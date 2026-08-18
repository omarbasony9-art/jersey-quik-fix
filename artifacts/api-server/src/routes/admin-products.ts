/**
 * admin-products.ts — Admin product CRUD routes
 * All routes require Bearer admin token via requireAdminAuth middleware.
 *
 * Price contract: all price values returned from this API are in CENTS (integer).
 * The DB stores prices as NUMERIC dollars; we multiply ×100 on read, ÷100 on write.
 */
import { Router } from "express";
import { pool } from "@workspace/db";
import { randomUUID } from "crypto";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { requireAdminAuth } from "../middleware/adminAuth";

// __dirname in the esbuild bundle == dist/ directory
const PRODUCT_IMAGES_DIR = join(__dirname, "../public/product-images");
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg":  ".jpg",
  "image/png":  ".png",
  "image/webp": ".webp",
  "image/gif":  ".gif",
};

const adminProductsRouter = Router();
adminProductsRouter.use(requireAdminAuth);

/** Convert a Postgres row to the shape the admin UI expects (camelCase, cents). */
function normalizeProduct(r: any) {
  return {
    id:            r.id,
    sku:           r.sku,
    name:          r.name,
    category:      r.category,
    subcategory:   r.subcategory ?? null,
    description:   r.description ?? "",
    price:         Math.round(Number(r.price) * 100), // cents
    oldPrice:      r.old_price != null ? Math.round(Number(r.old_price) * 100) : null,
    priceNote:     r.price_note ?? null,
    condition:     r.condition,
    configuration: r.configuration ?? {},
    stock:         Number(r.stock ?? 0),
    images:        r.images ?? [],
    badge:         r.badge ?? null,
    rating:        Number(r.rating ?? 0),
    active:        r.active,
    featured:      r.featured,
    verified:      r.verified,
    verificationNote: r.verification_note ?? null,
    createdAt:     r.created_at,
    updatedAt:     r.updated_at,
    inventoryQuantity: r.inventory_quantity != null ? Number(r.inventory_quantity) : undefined,
    reserved:      r.reserved != null ? Number(r.reserved) : undefined,
  };
}

// ── GET /api/admin/products ─────────────────────────────────────────────────
adminProductsRouter.get("/admin/products", async (req, res): Promise<void> => {
  const {
    category, subcategory, search, condition,
    active, verified, featured,
    sort = "newest", page = "1", limit = "25",
  } = req.query as Record<string, string>;

  const pageNum  = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 25));
  const offset   = (pageNum - 1) * limitNum;

  const conds: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (category)                { conds.push(`p.category = $${idx++}`);    params.push(category); }
  if (subcategory)             { conds.push(`p.subcategory = $${idx++}`);  params.push(subcategory); }
  if (condition)               { conds.push(`p.condition = $${idx++}`);   params.push(condition); }
  if (active !== undefined)    { conds.push(`p.active = $${idx++}`);      params.push(active === "true"); }
  if (verified !== undefined)  { conds.push(`p.verified = $${idx++}`);    params.push(verified === "true"); }
  if (featured !== undefined)  { conds.push(`p.featured = $${idx++}`);    params.push(featured === "true"); }
  if (search) {
    conds.push(`(p.name ILIKE $${idx} OR p.sku ILIKE $${idx} OR p.description ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }

  const orderMap: Record<string, string> = {
    newest:     "p.created_at DESC",
    oldest:     "p.created_at ASC",
    price_asc:  "p.price ASC",
    price_desc: "p.price DESC",
    name_asc:   "p.name ASC",
    stock_asc:  "i.quantity ASC",
  };
  const orderBy = orderMap[sort] ?? "p.created_at DESC";
  const where   = conds.length ? `WHERE ${conds.join(" AND ")}` : "";

  try {
    const countRes = await pool.query<{ total: string }>(
      `SELECT COUNT(*) AS total FROM products p LEFT JOIN inventory i ON i.product_id = p.id ${where}`,
      params
    );
    const total = parseInt(countRes.rows[0].total, 10);

    const dataRes = await pool.query(
      `SELECT p.*, i.quantity AS inventory_quantity, i.reserved, i.threshold
       FROM products p
       LEFT JOIN inventory i ON i.product_id = p.id
       ${where}
       ORDER BY ${orderBy}
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limitNum, offset]
    );

    res.json({
      products: dataRes.rows.map(normalizeProduct),
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      limit: limitNum,
    });
  } catch (err) {
    console.error("GET /api/admin/products error:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// ── POST /api/admin/products ────────────────────────────────────────────────
adminProductsRouter.post("/admin/products", async (req, res): Promise<void> => {
  const {
    name, category, subcategory, description = "", price, oldPrice,
    priceNote, condition = "Used-Good", configuration, stock = 1,
    sku, images = [], badge, rating = 4.5, active = true,
    featured = false, verified = true, verificationNote,
  } = req.body as Record<string, any>;

  if (!name || !category || price == null || !sku) {
    res.status(400).json({ error: "name, category, price (in cents), and sku are required" });
    return;
  }

  // Price from UI is in cents; convert to dollars for DB storage
  const priceDollars    = Number(price) / 100;
  const oldPriceDollars = oldPrice != null ? Number(oldPrice) / 100 : null;

  const id = randomUUID();
  try {
    await pool.query(
      `INSERT INTO products
         (id, name, category, subcategory, description, price, old_price, price_note,
          condition, configuration, stock, sku, images, badge, rating, active, featured,
          verified, verification_note)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`,
      [id, name, category, subcategory ?? null, description, priceDollars, oldPriceDollars,
       priceNote ?? null, condition, configuration ? JSON.stringify(configuration) : null,
       stock, sku, images, badge ?? null, rating, active, featured, verified,
       verificationNote ?? null]
    );

    await pool.query(
      `INSERT INTO inventory (product_id, quantity, threshold)
       VALUES ($1, $2, 2)
       ON CONFLICT (product_id) DO NOTHING`,
      [id, stock]
    );

    const product = await pool.query("SELECT * FROM products WHERE id = $1", [id]);
    res.status(201).json(normalizeProduct(product.rows[0]));
  } catch (err: any) {
    if (err.constraint === "products_sku_key") {
      res.status(409).json({ error: "SKU already exists" });
    } else {
      console.error("POST /api/admin/products error:", err);
      res.status(500).json({ error: "Failed to create product" });
    }
  }
});

// ── PATCH /api/admin/products/:id ──────────────────────────────────────────
adminProductsRouter.patch("/admin/products/:id", async (req, res): Promise<void> => {
  const { id } = req.params;
  const fields = { ...(req.body as Record<string, any>) };

  // Price from admin UI is in cents; convert to dollars before writing to DB
  if ("price" in fields && fields.price != null) {
    fields.price = Number(fields.price) / 100;
  }
  if ("oldPrice" in fields && fields.oldPrice != null) {
    fields.oldPrice = Number(fields.oldPrice) / 100;
  }

  const columnMap: Record<string, string> = {
    name: "name", category: "category", subcategory: "subcategory",
    description: "description", price: "price", oldPrice: "old_price",
    priceNote: "price_note", condition: "condition", configuration: "configuration",
    stock: "stock", sku: "sku", images: "images", badge: "badge", rating: "rating",
    active: "active", featured: "featured", verified: "verified",
    verificationNote: "verification_note",
  };

  const setClauses: string[] = [];
  const params: unknown[]    = [];
  let idx = 1;

  for (const [jsKey, col] of Object.entries(columnMap)) {
    if (jsKey in fields) {
      const val = jsKey === "configuration" && fields[jsKey] != null
        ? JSON.stringify(fields[jsKey])
        : fields[jsKey];
      setClauses.push(`${col} = $${idx++}`);
      params.push(val);
    }
  }

  if (!setClauses.length) {
    res.status(400).json({ error: "No valid fields to update" });
    return;
  }

  setClauses.push(`updated_at = NOW()`);
  params.push(id);

  try {
    const result = await pool.query(
      `UPDATE products SET ${setClauses.join(", ")} WHERE id = $${idx} RETURNING *`,
      params
    );
    if (!result.rows.length) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    // Sync stock to inventory if provided
    if ("stock" in fields) {
      await pool.query(
        `INSERT INTO inventory (product_id, quantity, threshold)
         VALUES ($1, $2, 2)
         ON CONFLICT (product_id) DO UPDATE SET quantity = $2, updated_at = NOW()`,
        [id, fields.stock]
      );
    }

    res.json(normalizeProduct(result.rows[0]));
  } catch (err: any) {
    if (err.constraint === "products_sku_key") {
      res.status(409).json({ error: "SKU already exists" });
    } else {
      console.error("PATCH /api/admin/products/:id error:", err);
      res.status(500).json({ error: "Failed to update product" });
    }
  }
});

// ── DELETE /api/admin/products/:id ─────────────────────────────────────────
adminProductsRouter.delete("/admin/products/:id", async (req, res): Promise<void> => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM inventory WHERE product_id = $1", [id]);
    const result = await pool.query("DELETE FROM products WHERE id = $1 RETURNING id", [id]);
    if (!result.rows.length) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.json({ deleted: id });
  } catch (err) {
    console.error("DELETE /api/admin/products/:id error:", err);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

// ── POST /api/admin/products/bulk ──────────────────────────────────────────
adminProductsRouter.post("/admin/products/bulk", async (req, res): Promise<void> => {
  const { ids, action } = req.body as { ids: string[]; action: "activate" | "deactivate" | "delete" };
  if (!Array.isArray(ids) || !ids.length) {
    res.status(400).json({ error: "ids array is required" });
    return;
  }
  const placeholders = ids.map((_, i) => `$${i + 1}`).join(",");
  try {
    if (action === "activate") {
      await pool.query(`UPDATE products SET active = TRUE, updated_at = NOW() WHERE id IN (${placeholders})`, ids);
    } else if (action === "deactivate") {
      await pool.query(`UPDATE products SET active = FALSE, updated_at = NOW() WHERE id IN (${placeholders})`, ids);
    } else if (action === "delete") {
      await pool.query(`DELETE FROM inventory WHERE product_id IN (${placeholders})`, ids);
      await pool.query(`DELETE FROM products WHERE id IN (${placeholders})`, ids);
    } else {
      res.status(400).json({ error: "action must be activate, deactivate, or delete" });
      return;
    }
    res.json({ success: true, affected: ids.length });
  } catch (err) {
    console.error("POST /api/admin/products/bulk error:", err);
    res.status(500).json({ error: "Bulk action failed" });
  }
});

// ── GET /api/admin/inventory ────────────────────────────────────────────────
adminProductsRouter.get("/admin/inventory", async (_req, res): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT i.product_id, p.name, p.category, p.sku, p.active,
              i.quantity, i.reserved, i.threshold
       FROM inventory i
       JOIN products p ON p.id = i.product_id
       ORDER BY p.category, p.name`
    );
    res.json({
      inventory: result.rows.map(r => ({
        productId:   r.product_id,
        productName: r.name,
        category:    r.category,
        sku:         r.sku,
        active:      r.active,
        quantity:    Number(r.quantity),
        reserved:    Number(r.reserved ?? 0),
        threshold:   Number(r.threshold ?? 2),
        available:   Math.max(0, Number(r.quantity) - Number(r.reserved ?? 0)),
      })),
    });
  } catch (err) {
    console.error("GET /api/admin/inventory error:", err);
    res.status(500).json({ error: "Failed to fetch inventory" });
  }
});

// ── PATCH /api/admin/inventory/:productId ──────────────────────────────────
adminProductsRouter.patch("/admin/inventory/:productId", async (req, res): Promise<void> => {
  const { productId } = req.params;
  const { quantity, reserved, threshold } = req.body as Record<string, number>;

  const setClauses: string[] = [];
  const params: unknown[]    = [];
  let idx = 1;

  if (quantity  != null) { setClauses.push(`quantity = $${idx++}`);  params.push(quantity);  }
  if (reserved  != null) { setClauses.push(`reserved = $${idx++}`);  params.push(reserved);  }
  if (threshold != null) { setClauses.push(`threshold = $${idx++}`); params.push(threshold); }
  setClauses.push(`updated_at = NOW()`);
  params.push(productId);

  try {
    await pool.query(
      `UPDATE inventory SET ${setClauses.join(", ")} WHERE product_id = $${idx}`,
      params
    );
    // Sync product stock column
    if (quantity != null) {
      await pool.query(
        `UPDATE products SET stock = $1, updated_at = NOW() WHERE id = $2`,
        [quantity, productId]
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error("PATCH /api/admin/inventory/:productId error:", err);
    res.status(500).json({ error: "Failed to update inventory" });
  }
});

// ── Image upload ────────────────────────────────────────────────────────────
// POST /admin/product-images/upload
// Body: { filename: string, mimeType: string, data: string (base64, no prefix) }
// Returns: { url: string }  ("/api/product-images/<filename>")
adminProductsRouter.post("/admin/product-images/upload", (req, res) => {
  try {
    const { filename = "upload", mimeType, data } = req.body as {
      filename?: string;
      mimeType: string;
      data: string;
    };

    const ext = MIME_TO_EXT[mimeType?.toLowerCase()];
    if (!ext) {
      return res.status(400).json({ error: "Unsupported image type. Use JPEG, PNG, WebP, or GIF." });
    }
    if (!data) {
      return res.status(400).json({ error: "No image data provided." });
    }

    const buffer = Buffer.from(data, "base64");
    if (buffer.length > 15 * 1024 * 1024) {
      return res.status(400).json({ error: "File too large (max 15 MB)." });
    }

    // Sanitise: keep alphanumeric, hyphens, underscores, dots; strip extension; re-add correct one
    const safeStem = filename
      .replace(/\.[^.]*$/, "")          // drop extension from original name
      .replace(/[^a-zA-Z0-9_\-.]/g, "-") // sanitise
      .replace(/-+/g, "-")
      .slice(0, 120)
      || "upload";
    const saveName = `${safeStem}${ext}`;

    mkdirSync(PRODUCT_IMAGES_DIR, { recursive: true });
    writeFileSync(join(PRODUCT_IMAGES_DIR, saveName), buffer);

    return res.json({ url: `/api/product-images/${saveName}` });
  } catch (err: any) {
    console.error("POST /admin/product-images/upload error:", err);
    return res.status(500).json({ error: err?.message ?? "Upload failed." });
  }
});

export default adminProductsRouter;
