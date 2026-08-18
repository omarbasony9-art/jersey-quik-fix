/**
 * products.ts — Public product routes
 * GET /api/products         — paginated, filterable, sortable
 * GET /api/products/:id     — single product + related products
 */
import { Router } from "express";
import { pool } from "@workspace/db";

const productsRouter = Router();

// ── GET /api/products ───────────────────────────────────────────────────────
productsRouter.get("/products", async (req, res): Promise<void> => {
  const {
    category,
    subcategory,
    search,
    condition,
    minPrice,
    maxPrice,
    inStock,
    featured,
    sort = "newest",
    page = "1",
    limit = "24",
  } = req.query as Record<string, string>;

  const pageNum  = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 24));
  const offset   = (pageNum - 1) * limitNum;

  const conditions: string[] = ["p.active = TRUE", "p.verified = TRUE OR p.category = 'Unverified Inventory'"];
  const params: unknown[]    = [];
  let   idx = 1;

  if (category) {
    conditions.push(`p.category = $${idx++}`);
    params.push(category);
  }
  if (subcategory) {
    conditions.push(`p.subcategory = $${idx++}`);
    params.push(subcategory);
  }
  if (search) {
    conditions.push(`(p.name ILIKE $${idx} OR p.description ILIKE $${idx} OR p.category ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }
  if (condition) {
    conditions.push(`p.condition = $${idx++}`);
    params.push(condition);
  }
  if (minPrice) {
    conditions.push(`p.price >= $${idx++}`);
    params.push(parseFloat(minPrice));
  }
  if (maxPrice) {
    conditions.push(`p.price <= $${idx++}`);
    params.push(parseFloat(maxPrice));
  }
  if (inStock === "true") {
    conditions.push(`i.quantity > 0`);
  }
  if (featured === "true") {
    conditions.push(`p.featured = TRUE`);
  }

  const orderMap: Record<string, string> = {
    newest:     "p.created_at DESC",
    oldest:     "p.created_at ASC",
    price_asc:  "p.price ASC",
    price_desc: "p.price DESC",
    name_asc:   "p.name ASC",
    rating:     "p.rating DESC",
  };
  const orderBy = orderMap[sort] ?? "p.created_at DESC";

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    const countResult = await pool.query<{ total: string }>(
      `SELECT COUNT(*) AS total
       FROM products p
       LEFT JOIN inventory i ON i.product_id = p.id
       ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].total, 10);

    const dataResult = await pool.query(
      `SELECT p.*, i.quantity AS inventory_quantity, i.reserved
       FROM products p
       LEFT JOIN inventory i ON i.product_id = p.id
       ${where}
       ORDER BY ${orderBy}
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limitNum, offset]
    );

    res.json({
      products:   dataResult.rows,
      total,
      page:       pageNum,
      totalPages: Math.ceil(total / limitNum),
      limit:      limitNum,
    });
  } catch (err) {
    console.error("GET /api/products error:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// ── GET /api/products/categories ───────────────────────────────────────────
productsRouter.get("/products/categories", async (_req, res): Promise<void> => {
  try {
    const result = await pool.query<{ category: string; count: string }>(
      `SELECT category, COUNT(*) AS count
       FROM products
       WHERE active = TRUE
       GROUP BY category
       ORDER BY category`
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// ── GET /api/products/:id ───────────────────────────────────────────────────
productsRouter.get("/products/:id", async (req, res): Promise<void> => {
  const { id } = req.params;
  try {
    const productRes = await pool.query(
      `SELECT p.*, i.quantity AS inventory_quantity, i.reserved, i.threshold
       FROM products p
       LEFT JOIN inventory i ON i.product_id = p.id
       WHERE p.id = $1 AND p.active = TRUE`,
      [id]
    );
    if (!productRes.rows.length) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    const product = productRes.rows[0];

    // Related products — same category, excluding self
    const relatedRes = await pool.query(
      `SELECT p.*, i.quantity AS inventory_quantity
       FROM products p
       LEFT JOIN inventory i ON i.product_id = p.id
       WHERE p.category = $1 AND p.id != $2 AND p.active = TRUE
       ORDER BY p.rating DESC
       LIMIT 6`,
      [product.category, id]
    );

    res.json({ product, related: relatedRes.rows });
  } catch (err) {
    console.error("GET /api/products/:id error:", err);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

export default productsRouter;
