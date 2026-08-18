/**
 * admin-orders.ts — Admin order management routes
 * GET  /api/admin/orders        — list all orders, newest first
 * GET  /api/admin/orders/:id    — order detail with line items
 * PATCH /api/admin/orders/:id   — update fulfillment status
 */
import { Router } from "express";
import { pool } from "@workspace/db";
import { requireAdminAuth } from "../middleware/adminAuth";

const adminOrdersRouter = Router();
adminOrdersRouter.use(requireAdminAuth);

// ── GET /api/admin/orders ───────────────────────────────────────────────────
adminOrdersRouter.get("/admin/orders", async (req, res): Promise<void> => {
  const { status, page = "1", limit = "25" } = req.query as Record<string, string>;
  const pageNum  = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));
  const offset   = (pageNum - 1) * limitNum;

  const conds: string[] = [];
  const params: unknown[] = [];
  let idx = 1;
  if (status) { conds.push(`o.status = $${idx++}`); params.push(status); }
  const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";

  try {
    const countRes = await pool.query<{ total: string }>(
      `SELECT COUNT(*) AS total FROM orders o ${where}`, params
    );
    const total = parseInt(countRes.rows[0].total, 10);

    const ordersRes = await pool.query(
      `SELECT o.*,
              COALESCE(json_agg(
                json_build_object(
                  'id', oi.id, 'product_id', oi.product_id,
                  'product_name', oi.product_name, 'product_image', oi.product_image,
                  'price', oi.price, 'quantity', oi.quantity
                ) ORDER BY oi.id
              ) FILTER (WHERE oi.id IS NOT NULL), '[]') AS items
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       ${where}
       GROUP BY o.id
       ORDER BY o.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limitNum, offset]
    );

    res.json({
      orders: ordersRes.rows,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      limit: limitNum,
    });
  } catch (err) {
    console.error("GET /api/admin/orders error:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// ── GET /api/admin/orders/:id ───────────────────────────────────────────────
adminOrdersRouter.get("/admin/orders/:id", async (req, res): Promise<void> => {
  const { id } = req.params;
  try {
    const orderRes = await pool.query(
      `SELECT o.*,
              COALESCE(json_agg(
                json_build_object(
                  'id', oi.id, 'product_id', oi.product_id,
                  'product_name', oi.product_name, 'product_image', oi.product_image,
                  'price', oi.price, 'quantity', oi.quantity
                ) ORDER BY oi.id
              ) FILTER (WHERE oi.id IS NOT NULL), '[]') AS items
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE o.id = $1
       GROUP BY o.id`,
      [id]
    );
    if (!orderRes.rows.length) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    res.json(orderRes.rows[0]);
  } catch (err) {
    console.error("GET /api/admin/orders/:id error:", err);
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

// ── PATCH /api/admin/orders/:id ─────────────────────────────────────────────
adminOrdersRouter.patch("/admin/orders/:id", async (req, res): Promise<void> => {
  const { id }    = req.params;
  const { status } = req.body as { status?: string };
  const allowed   = ["paid", "packed", "shipped", "delivered", "cancelled"];

  if (!status || !allowed.includes(status)) {
    res.status(400).json({ error: `status must be one of: ${allowed.join(", ")}` });
    return;
  }
  try {
    const result = await pool.query(
      `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, id]
    );
    if (!result.rows.length) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("PATCH /api/admin/orders/:id error:", err);
    res.status(500).json({ error: "Failed to update order status" });
  }
});

// ── GET /api/orders/confirmation/:sessionId (public — called after Stripe redirect)
adminOrdersRouter.get("/orders/confirmation/:sessionId", async (req, res): Promise<void> => {
  const { sessionId } = req.params;
  try {
    const result = await pool.query(
      `SELECT o.*,
              COALESCE(json_agg(
                json_build_object(
                  'product_name', oi.product_name, 'product_image', oi.product_image,
                  'price', oi.price, 'quantity', oi.quantity
                ) ORDER BY oi.id
              ) FILTER (WHERE oi.id IS NOT NULL), '[]') AS items
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE o.stripe_session_id = $1
       GROUP BY o.id`,
      [sessionId]
    );
    if (!result.rows.length) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("GET /api/orders/confirmation/:sessionId error:", err);
    res.status(500).json({ error: "Failed to fetch order confirmation" });
  }
});

export default adminOrdersRouter;
