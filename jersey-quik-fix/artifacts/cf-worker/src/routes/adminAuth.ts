import type { Hono } from "hono";
import type { Env } from "../types";
import { createAdminToken } from "../lib/adminToken";

export function registerAdminAuth(app: Hono<{ Bindings: Env }>) {
  // POST /api/admin/login
  app.post("/api/admin/login", async (c) => {
    const { password } = await c.req.json<{ password?: string }>();
    if (!password || password !== c.env.ADMIN_PASSWORD) {
      return c.json({ error: "Invalid password" }, 401);
    }
    const token = await createAdminToken(c.env.SESSION_SECRET);
    return c.json({ token, role: "admin" });
  });
}
