export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;

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
