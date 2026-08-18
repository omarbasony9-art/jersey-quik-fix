import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import router from "./routes";
import { logger } from "./lib/logger";
import { WebhookHandlers } from "./webhookHandlers";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";

const app: Express = express();

// ── Clerk proxy (must be BEFORE body parsers — streams raw bytes) ──────────
app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

// ── Stripe webhook (must be BEFORE express.json() — needs raw Buffer) ──────
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.headers["stripe-signature"];
    if (!signature) {
      res.status(400).json({ error: "Missing stripe-signature" });
      return;
    }
    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;
      await WebhookHandlers.processWebhook(req.body as Buffer, sig);
      res.status(200).json({ received: true });
    } catch (err: any) {
      logger.error({ err }, "Stripe webhook error");
      res.status(400).json({ error: "Webhook processing error" });
    }
  }
);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  })
);

app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Serve locally-downloaded product images ────────────────────────────────
import path from "path";
import { createReadStream, existsSync } from "fs";
// Mount at /api/product-images so the JQF frontend proxy handles it correctly
app.use("/api/product-images", (req, res, next) => {
  // Strip query string, sanitize
  const file = decodeURIComponent(req.path.replace(/^\//, "").replace(/\.\./g, ""));
  const base = path.join(__dirname, "../public/product-images");
  // Try exact path, then .jpg → .svg fallback
  const exact = path.join(base, file);
  const svgFallback = exact.replace(/\.(jpg|png|webp)$/i, ".svg");
  if (existsSync(exact)) {
    const ext = path.extname(exact).toLowerCase();
    const mime: Record<string, string> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml" };
    res.setHeader("Content-Type", mime[ext] || "application/octet-stream");
    res.setHeader("Cache-Control", "public, max-age=86400");
    createReadStream(exact).pipe(res);
  } else if (existsSync(svgFallback)) {
    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "public, max-age=86400");
    createReadStream(svgFallback).pipe(res);
  } else {
    next();
  }
});

// ── Clerk session middleware ────────────────────────────────────────────────
app.use(
  clerkMiddleware((req) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? "",
      process.env.CLERK_PUBLISHABLE_KEY,
    ),
  }))
);

app.use("/api", router);

export default app;
