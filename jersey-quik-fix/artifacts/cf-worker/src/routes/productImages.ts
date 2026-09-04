/**
 * Public product-image serving route (no auth required).
 *
 * GET /api/product-images/:filename
 *
 * Lookup order:
 *   1. R2 (PRODUCT_IMAGES bucket) — images uploaded via admin
 *   2. Worker ASSETS fallback     — SVG files bundled as static assets
 *                                   at /api/product-images/<filename>
 *
 * This dual strategy means:
 *   • Seed images (SVG files shipped in gamevault/public/api/product-images/)
 *     are served immediately without any R2 uploads.
 *   • Images uploaded via the admin are stored in R2 and take priority.
 */

import type { Hono } from "hono";
import type { Env } from "../types";

const SAFE_RASTER_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function detectRasterType(bytes: Uint8Array): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

export function registerProductImages(app: Hono<{ Bindings: Env }>) {
  app.get("/api/product-images/:filename", async (c) => {
    try {
      const filename = c.req.param("filename");
      // Sanitise — prevent path traversal
      const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");

      // ── 1. Try R2 first (admin-uploaded images, only if R2 is enabled) ────────
      const object = c.env.PRODUCT_IMAGES
        ? await c.env.PRODUCT_IMAGES.get(safe)
        : null;
      if (object) {
        const bytes = new Uint8Array(await object.arrayBuffer());
        const detectedType = detectRasterType(bytes);
        const storedType = object.httpMetadata?.contentType || "";
        if (!detectedType || !SAFE_RASTER_TYPES.has(storedType) || storedType !== detectedType) {
          return c.json({ error: "Image failed validation" }, 415);
        }
        const headers = new Headers();
        headers.set("Content-Type", detectedType);
        headers.set("Cache-Control", "public, max-age=31536000, immutable");
        return new Response(bytes, { headers });
      }

      // ── 2. Fall back to ASSETS (bundled SVG seed images) ────────────────────
      // The file lives at /api/product-images/<safe> in the static asset bundle
      // (source: jersey-quik-fix/artifacts/gamevault/public/api/product-images/)
      const assetUrl = new URL(
        `/api/product-images/${safe}`,
        c.req.url,
      );
      // We can't use the normal ASSETS fetcher here because we're already inside
      // an /api/* route that has intercepted the request. Instead we reconstruct
      // the asset URL and let the ASSETS Fetcher handle it.
      const assetReq = new Request(assetUrl.toString(), {
        method: "GET",
        headers: { "Accept": c.req.header("accept") || "*/*" },
      });
      const assetRes = await c.env.ASSETS.fetch(assetReq);
      const assetCt = assetRes.headers.get("content-type") || "";
      // In SPA mode a missing file returns index.html (200, text/html) — skip it.
      // Only forward the response if it's an actual image/media file.
      if (assetRes.ok && !assetCt.startsWith("text/html")) {
        const respHeaders = new Headers(assetRes.headers);
        respHeaders.set("Cache-Control", "public, max-age=31536000, immutable");
        return new Response(assetRes.body, {
          status: assetRes.status,
          headers: respHeaders,
        });
      }

      return c.json({ error: "Image not found" }, 404);
    } catch (err) {
      console.error("GET /api/product-images/:filename error:", err);
      return c.json({ error: "Failed to serve image" }, 500);
    }
  });
}
