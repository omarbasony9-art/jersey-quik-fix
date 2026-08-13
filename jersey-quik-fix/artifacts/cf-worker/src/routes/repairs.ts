import type { Hono } from "hono";
import type { Env } from "../types";
import { requireAdmin } from "../middleware/adminAuth";

function generateTicketNumber(): string {
  return "JQ-" + String(Math.floor(100000 + Math.random() * 900000));
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
    const body = await c.req.json<Record<string, string>>();
    const { category, brand, model, issue, name, phone, email, date } = body;
    if (!name || !phone || !model) {
      return c.json({ error: "name, phone, and model are required" }, 400);
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
        category ?? "Other",
        brand ?? "Other",
        model,
        issue ?? "Other",
        name,
        phone,
        email ?? "",
        date ?? "",
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
    const code = c.req.param("ticketCode").toUpperCase().trim();
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
