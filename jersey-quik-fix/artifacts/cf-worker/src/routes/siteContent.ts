import type { Hono } from "hono";
import type { Env } from "../types";
import { requireAdmin } from "../middleware/adminAuth";

const CONTENT_KEY = "jqf_site_content_v1";

export function registerSiteContent(app: Hono<{ Bindings: Env }>) {
  // GET /api/site-content — public
  app.get("/api/site-content", async (c) => {
    const row = await c.env.DB.prepare(
      "SELECT data FROM site_content WHERE key = ?",
    )
      .bind(CONTENT_KEY)
      .first<{ data: string }>();
    if (!row) return c.json(null);
    try {
      return c.json(JSON.parse(row.data));
    } catch {
      return c.json(null);
    }
  });

  // PUT /api/site-content — admin only
  app.put("/api/site-content", requireAdmin, async (c) => {
    const body = await c.req.json();
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return c.json({ error: "Body must be a JSON object" }, 400);
    }
    const now = new Date().toISOString();
    await c.env.DB.prepare(
      `INSERT INTO site_content (key, data, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
    )
      .bind(CONTENT_KEY, JSON.stringify(body), now)
      .run();

    // Read-after-write confirmation
    const confirmed = await c.env.DB.prepare(
      "SELECT data FROM site_content WHERE key = ?",
    )
      .bind(CONTENT_KEY)
      .first<{ data: string }>();
    if (!confirmed) return c.json({ error: "Save failed" }, 500);
    return c.json(JSON.parse(confirmed.data));
  });
}
