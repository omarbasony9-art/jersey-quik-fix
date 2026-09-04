import type { Hono } from "hono";
import type { Env } from "../types";

export function registerHealth(app: Hono<{ Bindings: Env }>) {
  app.get("/api/healthz", (c) => c.json({ status: "ok" }));
}
