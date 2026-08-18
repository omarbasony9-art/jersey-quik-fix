import { runMigrations } from "stripe-replit-sync";
import { getStripeSync } from "./stripeClient";
import app from "./app";
import { logger } from "./lib/logger";
import { runAppMigrations } from "./lib/migrate";
import { migrateExistingProducts } from "./lib/migrateExistingProducts";
import { seedCatalog } from "./lib/seed";

async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for Stripe integration.");
  }
  try {
    logger.info("Initializing Stripe schema...");
    await runMigrations({ databaseUrl, schema: "stripe" });
    logger.info("Stripe schema ready");

    const stripeSync = await getStripeSync();

    const webhookBaseUrl = `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}`;
    await stripeSync.findOrCreateManagedWebhook(`${webhookBaseUrl}/api/stripe/webhook`);
    logger.info("Stripe webhook configured");

    // Backfill runs in background — don't block startup
    stripeSync.syncBackfill()
      .then(() => logger.info("Stripe backfill complete"))
      .catch((err) => logger.error({ err }, "Stripe backfill error"));
  } catch (err) {
    logger.error({ err }, "Failed to initialize Stripe — payments will be unavailable");
    // Don't crash the server if Stripe init fails
  }
}

const rawPort = process.env["PORT"];
if (!rawPort) throw new Error("PORT environment variable is required but was not provided.");

const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) throw new Error(`Invalid PORT value: "${rawPort}"`);

// Run app DB migrations first
try {
  logger.info("Running app migrations...");
  await runAppMigrations();
  logger.info("App migrations complete");
} catch (err) {
  logger.error({ err }, "App migrations failed — continuing anyway");
}

// Migrate legacy JSONB products to products table
try {
  await migrateExistingProducts();
} catch (err) {
  logger.error({ err }, "Legacy product migration failed — continuing");
}

// Seed the full catalog
try {
  await seedCatalog();
} catch (err) {
  logger.error({ err }, "Catalog seed failed — continuing");
}

await initStripe();

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port }, "Server listening");
});
