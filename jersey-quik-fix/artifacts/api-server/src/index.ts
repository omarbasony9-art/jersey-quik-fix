import { runMigrations } from "stripe-replit-sync";
import { getStripeSync } from "./stripeClient";
import app from "./app";
import { logger } from "./lib/logger";

async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;
  const apiBaseUrl = process.env.API_BASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is required for Stripe integration.",
    );
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    logger.warn(
      "STRIPE_SECRET_KEY is missing — Stripe initialization skipped",
    );
    return;
  }

  try {
    logger.info("Initializing Stripe schema...");

    await runMigrations({
      databaseUrl,
      schema: "stripe",
    });

    logger.info("Stripe schema ready");

    const stripeSync = await getStripeSync();

    if (apiBaseUrl) {
      const webhookUrl =
        `${apiBaseUrl}/api/stripe/webhook`;

      await stripeSync.findOrCreateManagedWebhook(
        webhookUrl,
      );

      logger.info(
        { webhookUrl },
        "Stripe webhook configured",
      );
    } else {
      logger.warn(
        "API_BASE_URL missing — automatic Stripe webhook setup skipped",
      );
    }

    stripeSync
      .syncBackfill()
      .then(() =>
        logger.info("Stripe backfill complete"),
      )
      .catch((err) =>
        logger.error(
          { err },
          "Stripe backfill error",
        ),
      );
  } catch (err) {
    logger.error(
      { err },
      "Failed to initialize Stripe — payments will be unavailable",
    );
  }
}

const rawPort = process.env.PORT;

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(
    `Invalid PORT value: "${rawPort}"`,
  );
}

await initStripe();

app.listen(port, () => {
  logger.info(
    { port },
    "Server listening",
  );
});