/**
 * Jersey Quik Fix — Cloudflare Worker
 *
 * Serves:
 *   • /api/*   — all API routes (D1 database, Clerk auth, Stripe)
 *   • /*       — static frontend assets (gamevault dist/public) with SPA fallback
 *
 * Run `pnpm --filter @workspace/gamevault run build` before deploying so that
 * ../gamevault/dist/public exists for Wrangler to bundle as static assets.
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./types";

// Route registrars
import { registerHealth } from "./routes/health";
import { registerAdminAuth } from "./routes/adminAuth";
import { registerRepairs } from "./routes/repairs";
import { registerSiteContent } from "./routes/siteContent";
import { registerEmails } from "./routes/emails";
import { registerCart } from "./routes/cart";
import { registerTradeInquiries } from "./routes/tradeInquiries";
import { registerMembership } from "./routes/membership";
import { registerStripe } from "./routes/stripe";
import { registerProducts } from "./routes/products";
import { registerAdminProducts } from "./routes/adminProducts";
import { registerAdminProductImages } from "./routes/adminProductImages";
import { registerProductImages } from "./routes/productImages";

const app = new Hono<{ Bindings: Env }>();

// ── CORS ─────────────────────────────────────────────────────────────────────
// Allow requests from any origin so the Render frontend can call this Worker
// during the transition period.  Once fully on Cloudflare (same origin), CORS
// headers are not needed for browser requests.
app.use(
  "/api/*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  }),
);

// ── API routes ────────────────────────────────────────────────────────────────
registerHealth(app);
registerAdminAuth(app);
registerRepairs(app);
registerSiteContent(app);
registerEmails(app);
registerCart(app);
registerTradeInquiries(app);
registerMembership(app);
registerStripe(app);
registerProducts(app);
registerAdminProducts(app);
registerAdminProductImages(app);
registerProductImages(app);

// ── SPA / Static asset fallback ───────────────────────────────────────────────
// For any request that isn't an /api/* route, try to serve a static asset.
// If the asset doesn't exist (e.g. /shop, /admin), serve index.html so the
// React SPA router handles it client-side.
app.get("*", async (c) => {
  // Try to serve the exact asset first
  const assetRes = await c.env.ASSETS.fetch(c.req.raw);
  if (assetRes.status !== 404) return assetRes;

  // Fall back to index.html for SPA routing
  const indexUrl = new URL("/index.html", c.req.url);
  return c.env.ASSETS.fetch(
    new Request(indexUrl.toString(), { method: "GET" }),
  );
});

export default app;
