import type { Hono } from "hono";
import type { Env } from "../types";
import { createAdminToken } from "../lib/adminToken";
import {
  checkAdminLoginAllowed,
  clearAdminLoginFailures,
  consumeCloudflareRateLimit,
  consumePersistentRateLimit,
  readJsonBody,
  recordAdminLoginFailure,
  RequestBodyError,
} from "../lib/requestSecurity";

export function registerAdminAuth(app: Hono<{ Bindings: Env }>) {
  // POST /api/admin/login
  app.post("/api/admin/login", async (c) => {
    const distributedLimit = await consumeCloudflareRateLimit(
      c,
      "admin-login",
      c.env.ADMIN_LOGIN_RATE_LIMITER,
      60,
    );
    if (!distributedLimit.allowed) {
      c.header("Retry-After", String(distributedLimit.retryAfterSeconds));
      return c.json({ error: "Too many login attempts. Please try again later." }, 429);
    }
    const persistentLimit = await consumePersistentRateLimit(
      c,
      c.env.DB,
      "admin-login",
      10,
      60 * 1000,
    );
    if (!persistentLimit.allowed) {
      c.header("Retry-After", String(persistentLimit.retryAfterSeconds));
      return c.json({ error: "Too many login attempts. Please try again later." }, 429);
    }

    const limit = checkAdminLoginAllowed(c);
    if (!limit.allowed) {
      c.header("Retry-After", String(limit.retryAfterSeconds));
      return c.json({ error: "Too many login attempts. Please try again later." }, 429);
    }

    let password: string | undefined;
    try {
      ({ password } = await readJsonBody<{ password?: string }>(c, 4096));
    } catch (error) {
      if (error instanceof RequestBodyError) {
        return c.json({ error: error.message }, error.status);
      }
      throw error;
    }

    if (!password || password !== c.env.ADMIN_PASSWORD) {
      const retryAfter = recordAdminLoginFailure(c);
      if (retryAfter > 0) c.header("Retry-After", String(retryAfter));
      return c.json({ error: "Invalid password" }, 401);
    }
    clearAdminLoginFailures(c);
    const token = await createAdminToken(c.env.SESSION_SECRET);
    return c.json({ token, role: "admin" });
  });
}
