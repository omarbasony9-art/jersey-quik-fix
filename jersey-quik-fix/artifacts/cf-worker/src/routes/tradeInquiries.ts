import type { Hono } from "hono";
import type { Env } from "../types";
import { requireAdmin } from "../middleware/adminAuth";

const EMAIL_RE = /^\S+@\S+\.\S+$/;

export function registerTradeInquiries(app: Hono<{ Bindings: Env }>) {
  // POST /api/trade-inquiries — public
  app.post("/api/trade-inquiries", async (c) => {
    const { name, email, phone, deviceType, deviceDescription, condition, notes } =
      await c.req.json<Record<string, string>>();

    if (!name || !email || !phone || !deviceType || !deviceDescription || !condition) {
      return c.json({ error: "All required fields must be provided." }, 400);
    }
    if (!EMAIL_RE.test(email)) {
      return c.json({ error: "Invalid email address." }, 400);
    }

    const now = new Date().toISOString();
    const result = await c.env.DB.prepare(
      `INSERT INTO trade_inquiries
         (name, email, phone, device_type, device_description, condition, notes, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING *`,
    )
      .bind(
        name.trim(),
        email.trim().toLowerCase(),
        phone.trim(),
        deviceType,
        deviceDescription.trim(),
        condition,
        notes?.trim() ?? null,
        "New",
        now,
      )
      .first();
    return c.json(result, 201);
  });

  // GET /api/trade-inquiries — admin only, newest first
  app.get("/api/trade-inquiries", requireAdmin, async (c) => {
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM trade_inquiries ORDER BY created_at DESC",
    ).all();
    return c.json(results);
  });

  // PATCH /api/trade-inquiries/:id — admin only
  app.patch("/api/trade-inquiries/:id", requireAdmin, async (c) => {
    const id = parseInt(c.req.param("id") ?? "", 10);
    const { status } = await c.req.json<{ status?: string }>();
    if (!status || isNaN(id)) {
      return c.json({ error: "Invalid request." }, 400);
    }
    const updated = await c.env.DB.prepare(
      "UPDATE trade_inquiries SET status = ? WHERE id = ? RETURNING *",
    )
      .bind(status, id)
      .first();
    if (!updated) return c.json({ error: "Trade inquiry not found." }, 404);
    return c.json(updated);
  });

  // DELETE /api/trade-inquiries/:id — admin only
  app.delete("/api/trade-inquiries/:id", requireAdmin, async (c) => {
    const id = parseInt(c.req.param("id") ?? "", 10);
    if (isNaN(id)) return c.json({ error: "Invalid id." }, 400);
    await c.env.DB.prepare("DELETE FROM trade_inquiries WHERE id = ?")
      .bind(id)
      .run();
    return c.json({ ok: true });
  });
}
