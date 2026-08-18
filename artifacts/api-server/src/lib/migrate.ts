/**
 * migrate.ts — runs idempotent CREATE TABLE IF NOT EXISTS statements on startup.
 * Uses raw SQL so no drizzle-kit push is required in production.
 */
import { pool } from "@workspace/db";
import { logger } from "./logger";

export async function runAppMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id                TEXT PRIMARY KEY,
        name              TEXT NOT NULL,
        category          TEXT NOT NULL,
        subcategory       TEXT,
        description       TEXT NOT NULL DEFAULT '',
        price             NUMERIC(10,2) NOT NULL,
        old_price         NUMERIC(10,2),
        price_note        TEXT,
        condition         TEXT NOT NULL DEFAULT 'Used-Good',
        configuration     JSONB,
        stock             INTEGER NOT NULL DEFAULT 1,
        sku               TEXT NOT NULL UNIQUE,
        images            TEXT[] NOT NULL DEFAULT '{}',
        badge             TEXT,
        rating            NUMERIC(3,1) NOT NULL DEFAULT 4.5,
        active            BOOLEAN NOT NULL DEFAULT TRUE,
        featured          BOOLEAN NOT NULL DEFAULT FALSE,
        verified          BOOLEAN NOT NULL DEFAULT TRUE,
        verification_note TEXT,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS inventory (
        id         SERIAL PRIMARY KEY,
        product_id TEXT NOT NULL UNIQUE,
        quantity   INTEGER NOT NULL DEFAULT 0,
        reserved   INTEGER NOT NULL DEFAULT 0,
        threshold  INTEGER NOT NULL DEFAULT 2,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id                TEXT PRIMARY KEY,
        stripe_session_id TEXT NOT NULL UNIQUE,
        customer_email    TEXT NOT NULL DEFAULT '',
        customer_name     TEXT NOT NULL DEFAULT '',
        total             NUMERIC(10,2) NOT NULL,
        status            TEXT NOT NULL DEFAULT 'paid',
        shipping_address  JSONB,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id            SERIAL PRIMARY KEY,
        order_id      TEXT NOT NULL,
        product_id    TEXT,
        product_name  TEXT NOT NULL,
        product_image TEXT,
        price         NUMERIC(10,2) NOT NULL,
        quantity      INTEGER NOT NULL DEFAULT 1,
        storage       TEXT,
        color         TEXT,
        condition     TEXT,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Idempotent column additions for existing order_items tables
    await client.query(`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS storage TEXT`);
    await client.query(`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS color TEXT`);
    await client.query(`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS condition TEXT`);

    // Indexes for common query patterns
    await client.query(`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_products_active    ON products(active)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_products_sku       ON products(sku)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_order_items_order  ON order_items(order_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_inventory_product  ON inventory(product_id)`);

    await client.query("COMMIT");
    logger.info("App migrations complete");
  } catch (err) {
    await client.query("ROLLBACK");
    logger.error({ err }, "App migration failed");
    throw err;
  } finally {
    client.release();
  }
}
