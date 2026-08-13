import type { Hono } from "hono";
import type { Env } from "../types";
import { requireAdmin } from "../middleware/adminAuth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function registerEmails(app: Hono<{ Bindings: Env }>) {
  // POST /api/emails/subscribe — public
  app.post("/api/emails/subscribe", async (c) => {
    const { email, name, source } = await c.req.json<
      Record<string, string>
    >();
    if (!email || !EMAIL_RE.test(email)) {
      return c.json({ error: "A valid email address is required" }, 400);
    }
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    try {
      await c.env.DB.prepare(
        `INSERT INTO email_subscribers (id, email, name, source, created_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(email) DO NOTHING`,
      )
        .bind(
          id,
          email.toLowerCase().trim(),
          (name ?? "").trim(),
          source ?? "website",
          now,
        )
        .run();
    } catch {
      return c.json({ error: "Failed to subscribe" }, 500);
    }
    return c.json({ ok: true, message: "Subscribed successfully" });
  });

  // GET /api/emails — admin only, newest first
  app.get("/api/emails", requireAdmin, async (c) => {
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM email_subscribers ORDER BY created_at DESC",
    ).all();
    return c.json(results);
  });

  // DELETE /api/emails/:id — admin only
  app.delete("/api/emails/:id", requireAdmin, async (c) => {
    const id = c.req.param("id");
    await c.env.DB.prepare("DELETE FROM email_subscribers WHERE id = ?")
      .bind(id)
      .run();
    return c.json({ ok: true });
  });
}
