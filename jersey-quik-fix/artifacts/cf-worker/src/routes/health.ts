import type { Context, Hono } from "hono";
import type { Env } from "../types";

export function registerHealth(app: Hono<{ Bindings: Env }>) {
  const checkHealth = async (c: Context<{ Bindings: Env }>) => {
    let database = false;
    let products = false;
    let productStorage = false;
    let assets = false;

    try {
      const row = await c.env.DB.prepare(
        "SELECT EXISTS(SELECT 1 FROM products WHERE active = 1 LIMIT 1) AS ready",
      ).first<{ ready: number }>();
      database = true;
      products = row?.ready === 1;
    } catch {
      // Readiness response intentionally exposes no database error details.
    }

    try {
      if (c.env.PRODUCT_IMAGES) {
        await c.env.PRODUCT_IMAGES.list({ limit: 1 });
        productStorage = true;
      }
    } catch {
      // Readiness response intentionally exposes no storage error details.
    }

    try {
      const response = await c.env.ASSETS.fetch(
        new Request(new URL("/index.html", c.req.url)),
      );
      assets = response.ok;
    } catch {
      // Readiness response intentionally exposes no asset error details.
    }

    const ready = database && products && productStorage && assets;
    return c.json(
      {
        status: ready ? "ok" : "degraded",
        ready,
        checks: { database, products, productStorage, assets },
      },
      ready ? 200 : 503,
    );
  };

  app.get("/api/health", checkHealth);
  app.get("/api/healthz", checkHealth);
}
