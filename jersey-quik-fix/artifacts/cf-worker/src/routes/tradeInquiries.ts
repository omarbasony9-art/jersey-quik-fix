import type { Hono } from "hono";
import type { Env } from "../types";
import { requireAdmin } from "../middleware/adminAuth";
import {
  boundedString,
  consumeCloudflareRateLimit,
  consumePersistentRateLimit,
  readJsonBody,
  RequestBodyError,
} from "../lib/requestSecurity";

const EMAIL_RE = /^\S+@\S+\.\S+$/;

export function registerTradeInquiries(app: Hono<{ Bindings: Env }>) {
  // POST /api/trade-inquiries — public
  app.post("/api/trade-inquiries", async (c) => {
    const limit = await consumeCloudflareRateLimit(
      c,
      "trade-submit",
      c.env.PUBLIC_FORM_RATE_LIMITER,
      60,
    );
    if (!limit.allowed) {
      c.header("Retry-After", String(limit.retryAfterSeconds));
      return c.json({ error: "Too many trade-in requests. Please try again later." }, 429);
    }
    const persistentLimit = await consumePersistentRateLimit(
      c,
      c.env.DB,
      "trade-submit",
      10,
      60 * 1000,
    );
    if (!persistentLimit.allowed) {
      c.header("Retry-After", String(persistentLimit.retryAfterSeconds));
      return c.json({ error: "Too many trade-in requests. Please try again later." }, 429);
    }

    let body: Record<string, unknown>;
    try {
      body = await readJsonBody<Record<string, unknown>>(c, 16 * 1024);
    } catch (error) {
      if (error instanceof RequestBodyError) {
        return c.json({ error: error.message }, error.status);
      }
      throw error;
    }

    let name: string;
    let email: string;
    let phone: string;
    let deviceType: string;
    let deviceDescription: string;
    let condition: string;
    let notes: string;
    try {
      name = boundedString(body.name, "name", 120, true);
      email = boundedString(body.email, "email", 254, true).toLowerCase();
      phone = boundedString(body.phone, "phone", 40, true);
      deviceType = boundedString(body.deviceType, "deviceType", 80, true);
      deviceDescription = boundedString(body.deviceDescription, "deviceDescription", 2000, true);
      condition = boundedString(body.condition, "condition", 80, true);
      notes = boundedString(body.notes, "notes", 2000);
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Invalid request" }, 400);
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
        name,
        email,
        phone,
        deviceType,
        deviceDescription,
        condition,
        notes || null,
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
