/**
 * Public product-image serving route (no auth required).
 *
 * GET /api/product-images/:filename — serve image bytes from R2
 *
 * Returns the raw image with the correct Content-Type and aggressive caching
 * headers (1 year, immutable).  If the object is not found in R2 a 404 is
 * returned so the browser does not cache a bad response.
 */

import type { Hono } from "hono";
import type { Env } from "../types";

export function registerProductImages(app: Hono<{ Bindings: Env }>) {
  app.get("/api/product-images/:filename", async (c) => {
    try {
      const filename = c.req.param("filename");
      // Sanitise — prevent path traversal
      const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");

      const object = await c.env.PRODUCT_IMAGES.get(safe);
      if (!object) {
        return c.json({ error: "Image not found" }, 404);
      }

      const contentType =
        object.httpMetadata?.contentType || "application/octet-stream";

      const headers = new Headers();
      headers.set("Content-Type", contentType);
      // Cache aggressively — filenames are content-addressed (UUID prefix)
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
      // Allow cross-origin image loads from the admin dashboard
      headers.set("Access-Control-Allow-Origin", "*");

      return new Response(object.body, { headers });
    } catch (err) {
      console.error("GET /api/product-images/:filename error:", err);
      return c.json({ error: "Failed to serve image" }, 500);
    }
  });
}
