/**
 * Admin product-image routes (require valid admin token).
 *
 * POST   /api/admin/product-images/upload   — upload image to R2; record in D1
 * GET    /api/admin/product-images/list     — list images from D1 metadata table
 * DELETE /api/admin/product-images/:filename — delete from R2 + D1
 *
 * Body for POST upload:
 *   { filename: string, data: string (base64, no prefix), mimeType: string }
 * Response:
 *   { url: string }
 */

import type { Hono } from "hono";
import type { Env } from "../types";
import { verifyAdminToken } from "../lib/adminToken";

async function requireAdmin(
  authHeader: string | undefined,
  secret: string,
): Promise<boolean> {
  const raw = authHeader || "";
  const token = raw.startsWith("Bearer ") ? raw.slice(7) : raw;
  if (!token) return false;
  return verifyAdminToken(token, secret);
}

/** Convert base64 string → Uint8Array without atob (works in Workers). */
function base64ToUint8Array(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = {
  "image/jpeg": { extensions: [".jpg", ".jpeg"], matches: (b: Uint8Array) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  "image/png": { extensions: [".png"], matches: (b: Uint8Array) => b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a },
  "image/webp": { extensions: [".webp"], matches: (b: Uint8Array) => b.length >= 12 && String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP" },
} as const;

export function registerAdminProductImages(app: Hono<{ Bindings: Env }>) {
  // ── Upload ──────────────────────────────────────────────────────────────────
  app.post("/api/admin/product-images/upload", async (c) => {
    if (!(await requireAdmin(c.req.header("authorization"), c.env.SESSION_SECRET))) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    try {
      const body = await c.req.json<{
        filename: string;
        data: string;       // base64, prefix already stripped by client
        mimeType: string;
      }>();

      if (!body.filename || !body.data || !body.mimeType) {
        return c.json({ error: "filename, data, and mimeType are required" }, 400);
      }

      const imageType = IMAGE_TYPES[body.mimeType as keyof typeof IMAGE_TYPES];
      if (!imageType) {
        return c.json({ error: "Only JPEG, PNG, and WebP images are allowed" }, 400);
      }
      if (body.data.length > Math.ceil(MAX_IMAGE_BYTES / 3) * 4 + 4) {
        return c.json({ error: "Image must be 5 MB or smaller" }, 413);
      }
      if (!/^[A-Za-z0-9+/]+={0,2}$/.test(body.data) || body.data.length % 4 !== 0) {
        return c.json({ error: "Invalid image data" }, 400);
      }

      const safe = body.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
      const bytes = base64ToUint8Array(body.data);
      const lowerFilename = safe.toLowerCase();
      if (
        !safe ||
        safe === "." ||
        safe === ".." ||
        bytes.byteLength === 0 ||
        bytes.byteLength > MAX_IMAGE_BYTES ||
        !imageType.extensions.some((extension) => lowerFilename.endsWith(extension)) ||
        !imageType.matches(bytes)
      ) {
        return c.json({ error: "Image content does not match its file type" }, 400);
      }

      // Upload to R2 (requires R2 to be enabled in the Cloudflare dashboard)
      if (!c.env.PRODUCT_IMAGES) {
        return c.json({ error: "Image uploads require R2 to be enabled. Please enable R2 in your Cloudflare dashboard and create the 'jqf-product-images' bucket." }, 503);
      }
      await c.env.PRODUCT_IMAGES.put(safe, bytes, {
        httpMetadata: { contentType: body.mimeType },
      });

      // Derive the public URL (served by the productImages route)
      const baseUrl = new URL(c.req.url).origin;
      const url = `${baseUrl}/api/product-images/${safe}`;

      // Record metadata in D1 so the list endpoint is fast
      await c.env.DB.prepare(`
        INSERT INTO product_images (filename, url, size, mime_type, created_at)
        VALUES (?, ?, ?, ?, datetime('now'))
        ON CONFLICT(filename) DO UPDATE SET
          url = excluded.url,
          size = excluded.size,
          mime_type = excluded.mime_type,
          created_at = excluded.created_at
      `).bind(safe, url, bytes.byteLength, body.mimeType).run();

      return c.json({ url });
    } catch (err) {
      console.error("POST /api/admin/product-images/upload error:", err);
      return c.json({ error: "Upload failed" }, 500);
    }
  });

  // ── List ────────────────────────────────────────────────────────────────────
  app.get("/api/admin/product-images/list", async (c) => {
    if (!(await requireAdmin(c.req.header("authorization"), c.env.SESSION_SECRET))) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    try {
      const result = await c.env.DB.prepare(
        "SELECT filename, url, size, created_at FROM product_images ORDER BY created_at DESC"
      ).all<{ filename: string; url: string; size: number; created_at: string }>();

      const images = (result.results || []).map((r) => ({
        filename: r.filename,
        url: r.url,
        size: r.size,
        modified: r.created_at,
      }));

      return c.json({ images });
    } catch (err) {
      console.error("GET /api/admin/product-images/list error:", err);
      return c.json({ error: "Failed to list images" }, 500);
    }
  });

  // ── Delete ──────────────────────────────────────────────────────────────────
  app.delete("/api/admin/product-images/:filename", async (c) => {
    if (!(await requireAdmin(c.req.header("authorization"), c.env.SESSION_SECRET))) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    try {
      const filename = c.req.param("filename");
      const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");

      // Delete from R2 (if R2 is enabled)
      if (c.env.PRODUCT_IMAGES) {
        await c.env.PRODUCT_IMAGES.delete(safe);
      }

      // Delete from D1 metadata
      await c.env.DB.prepare(
        "DELETE FROM product_images WHERE filename = ?"
      ).bind(safe).run();

      return c.json({ success: true });
    } catch (err) {
      console.error("DELETE /api/admin/product-images/:filename error:", err);
      return c.json({ error: "Failed to delete image" }, 500);
    }
  });
}
