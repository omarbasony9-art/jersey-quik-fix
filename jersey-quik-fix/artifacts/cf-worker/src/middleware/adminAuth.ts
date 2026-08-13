import type { Context, Next } from "hono";
import type { Env } from "../types";
import { verifyAdminToken } from "../lib/adminToken";

/**
 * Hono middleware — require a valid admin Bearer token.
 * Compatible with tokens issued by the Express/Render backend and this Worker.
 */
export async function requireAdmin(
  c: Context<{ Bindings: Env }>,
  next: Next,
): Promise<Response | void> {
  const auth = c.req.header("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const token = auth.slice(7).trim();
  const valid = await verifyAdminToken(token, c.env.SESSION_SECRET);
  if (!valid) return c.json({ error: "Unauthorized" }, 401);
  return next();
}
