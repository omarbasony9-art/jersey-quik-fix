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

function generateTicketNumber(): string {
  const random = new Uint8Array(10);
  crypto.getRandomValues(random);
  return `JQ-${Array.from(random, (byte) => byte.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

export function registerRepairs(app: Hono<{ Bindings: Env }>) {
  // GET /api/repairs — admin only, newest first
  app.get("/api/repairs", requireAdmin, async (c) => {
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM repair_tickets ORDER BY created_at DESC",
    ).all();
    return c.json(results);
  });

  // POST /api/repairs — public
  app.post("/api/repairs", async (c) => {
    const limit = await consumeCloudflareRateLimit(
      c,
      "repair-submit",
      c.env.PUBLIC_FORM_RATE_LIMITER,
      60,
    );
    if (!limit.allowed) {
      c.header("Retry-After", String(limit.retryAfterSeconds));
      return c.json({ error: "Too many repair requests. Please try again later." }, 429);
    }
    const persistentLimit = await consumePersistentRateLimit(
      c,
      c.env.DB,
      "repair-submit",
      10,
      60 * 1000,
    );
    if (!persistentLimit.allowed) {
      c.header("Retry-After", String(persistentLimit.retryAfterSeconds));
      return c.json({ error: "Too many repair requests. Please try again later." }, 429);
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

    let category: string;
    let brand: string;
    let model: string;
    let issue: string;
    let name: string;
    let phone: string;
    let email: string;
    let date: string;
    try {
      category = boundedString(body.category, "category", 80) || "Other";
      brand = boundedString(body.brand, "brand", 80) || "Other";
      model = boundedString(body.model, "model", 120, true);
      issue = boundedString(body.issue, "issue", 2000) || "Other";
      name = boundedString(body.name, "name", 120, true);
      phone = boundedString(body.phone, "phone", 40, true);
      email = boundedString(body.email, "email", 254);
      date = boundedString(body.date, "date", 40);
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("email is invalid");
      }
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Invalid request" }, 400);
    }
    const id = crypto.randomUUID();
    const ticket = generateTicketNumber();
    const now = new Date().toISOString();
    await c.env.DB.prepare(
      `INSERT INTO repair_tickets
         (id, ticket, category, brand, model, issue, name, phone, email, date, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        id,
        ticket,
        category,
        brand,
        model,
        issue,
        name,
        phone,
        email,
        date,
        "Checked In",
        now,
      )
      .run();

    const row = await c.env.DB.prepare(
      "SELECT * FROM repair_tickets WHERE id = ?",
    )
      .bind(id)
      .first();
    return c.json(row, 201);
  });

  // PATCH /api/repairs/:id/status — admin only
  app.patch("/api/repairs/:id/status", requireAdmin, async (c) => {
    const id = c.req.param("id");
    const { status } = await c.req.json<{ status?: string }>();
    if (!status) return c.json({ error: "Missing status" }, 400);

    const result = await c.env.DB.prepare(
      "UPDATE repair_tickets SET status = ? WHERE id = ? RETURNING *",
    )
      .bind(status, id)
      .first();
    if (!result) return c.json({ error: "Ticket not found" }, 404);
    return c.json(result);
  });

  // GET /api/repairs/lookup/:ticketCode — public
  app.get("/api/repairs/lookup/:ticketCode", async (c) => {
    const limit = await consumeCloudflareRateLimit(
      c,
      "repair-lookup",
      c.env.REPAIR_LOOKUP_RATE_LIMITER,
      60,
    );
    if (!limit.allowed) {
      c.header("Retry-After", String(limit.retryAfterSeconds));
      return c.json({ error: "Too many lookup attempts. Please try again later." }, 429);
    }
    const persistentLimit = await consumePersistentRateLimit(
      c,
      c.env.DB,
      "repair-lookup",
      30,
      60 * 1000,
    );
    if (!persistentLimit.allowed) {
      c.header("Retry-After", String(persistentLimit.retryAfterSeconds));
      return c.json({ error: "Too many lookup attempts. Please try again later." }, 429);
    }
    const code = c.req.param("ticketCode").toUpperCase().trim();
    if (!/^JQ-(?:\d{6}|[A-F0-9]{20})$/.test(code)) {
      return c.json({ error: "No ticket found with that code." }, 404);
    }
    const row = await c.env.DB.prepare(
      "SELECT * FROM repair_tickets WHERE ticket = ?",
    )
      .bind(code)
      .first<{
        ticket: string;
        category: string;
        brand: string;
        model: string;
        issue: string;
        status: string;
        date: string;
        created_at: string;
        name: string;
      }>();
    if (!row) return c.json({ error: "No ticket found with that code." }, 404);
    // Return privacy-safe fields only
    return c.json({
      ticket: row.ticket,
      category: row.category,
      brand: row.brand,
      model: row.model,
      issue: row.issue,
      status: row.status,
      date: row.date,
      createdAt: row.created_at,
      name: row.name ? row.name.split(" ")[0] : "",
    });
  });

  // DELETE /api/repairs/:id — admin only
  app.delete("/api/repairs/:id", requireAdmin, async (c) => {
    const id = c.req.param("id");
    await c.env.DB.prepare("DELETE FROM repair_tickets WHERE id = ?")
      .bind(id)
      .run();
    return c.json({ ok: true });
  });
}
