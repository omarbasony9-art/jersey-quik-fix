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

const CANONICAL_ORIGIN = "https://jerseyquikfix.com";
const ALLOWED_ORIGINS = new Set([
  CANONICAL_ORIGIN,
  "https://www.jerseyquikfix.com",
]);

app.use("*", async (c, next) => {
  const url = new URL(c.req.url);
  if (url.protocol !== "https:" || url.hostname === "www.jerseyquikfix.com") {
    url.protocol = "https:";
    url.host = "jerseyquikfix.com";
    return c.redirect(url.toString(), 308);
  }

  await next();
  c.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  c.header(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(self)",
  );
  c.header(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "script-src 'self' https://*.clerk.accounts.dev",
      "script-src-attr 'none'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://images.unsplash.com https://img.clerk.com",
      "connect-src 'self' https://*.clerk.accounts.dev",
      "frame-src 'self' https://*.clerk.accounts.dev https://checkout.stripe.com",
      "form-action 'self' https://checkout.stripe.com",
      "manifest-src 'self'",
      "worker-src 'self' blob:",
      "upgrade-insecure-requests",
    ].join("; "),
  );
});

// API responses must never be served from an earlier static SPA deployment.
// This keeps protected/admin routes and product JSON distinct from asset caching.
app.use("/api/*", async (c, next) => {
  await next();
  c.header("Cache-Control", "no-store, max-age=0");
});

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  "/api/*",
  cors({
    origin: (origin) => (ALLOWED_ORIGINS.has(origin) ? origin : ""),
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
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

app.all("/api/*", (c) => c.json({ error: "Not found" }, 404));

const RESERVED_MISSING_PATHS = new Set([
  "/sw.js",
  "/service-worker.js",
  "/manifest.json",
  "/manifest.webmanifest",
  "/sitemap.xml",
]);
const SPA_ROUTES = new Set([
  "/",
  "/shop",
  "/community",
  "/repair-status",
  "/sign-in",
  "/sign-up",
  "/admin",
]);
const BLOCKED_PATH_SEGMENTS = new Set([
  "debug",
  "preview",
  "__debug__",
  "__preview__",
  "phpmyadmin",
  "wp-admin",
  "wp-login.php",
]);
const BLOCKED_EXTENSIONS =
  /\.(?:map|js|mjs|cjs|ts|tsx|jsx|php|phtml|phar|exe|dll|sh|bash|bat|cmd|ps1|py|rb|pl|cgi|env|ini|log|sql|bak|old|orig|zip|tar|gz|7z)$/i;

// ── SPA / Static asset fallback ───────────────────────────────────────────────
// For any request that isn't an /api/* route, try to serve a static asset.
// If the asset doesn't exist (e.g. /shop, /admin), serve index.html so the
// React SPA router handles it client-side.
app.get("*", async (c) => {
  const path = new URL(c.req.url).pathname;
  const normalizedPath = path.length > 1 ? path.replace(/\/+$/, "") : path;
  const segments = normalizedPath.toLowerCase().split("/").filter(Boolean);
  if (
    RESERVED_MISSING_PATHS.has(normalizedPath) ||
    segments.some((segment) => segment.startsWith(".") || BLOCKED_PATH_SEGMENTS.has(segment))
  ) {
    return c.text("Not found", 404);
  }

  // Try to serve the exact asset first
  const assetRes = await c.env.ASSETS.fetch(c.req.raw);
  if (assetRes.status !== 404) return assetRes;

  if (BLOCKED_EXTENSIONS.test(normalizedPath) || !SPA_ROUTES.has(normalizedPath)) {
    return c.text("Not found", 404);
  }

  // Fall back to index.html for SPA routing
  const indexUrl = new URL("/index.html", c.req.url);
  return c.env.ASSETS.fetch(
    new Request(indexUrl.toString(), { method: "GET" }),
  );
});

export default app;
