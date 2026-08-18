export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  PRODUCT_IMAGES?: R2Bucket; // optional — requires R2 to be enabled in Cloudflare dashboard

  // Secrets (set via `wrangler secret put`)
  SESSION_SECRET: string;
  ADMIN_PASSWORD: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  CLERK_SECRET_KEY: string;

  // Non-secret config
  CLERK_PUBLISHABLE_KEY: string;
  FRONTEND_URL?: string;
}
