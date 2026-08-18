/**
 * migrateExistingProducts.ts
 * One-time migration: pulls the 8 products from the site-content JSONB blob
 * and upserts them into the new products + inventory tables.
 * Runs only when the products table is empty (idempotent).
 */
import { pool } from "@workspace/db";
import { logger } from "./logger";
import { randomUUID } from "crypto";

interface LegacyProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  oldPrice?: number;
  rating: number;
  badge?: string;
  image: string;
  stock: number;
  sku: string;
  active: boolean;
}

export async function migrateExistingProducts(): Promise<void> {
  const client = await pool.connect();
  try {
    // Check if products table already has rows
    const { rows: countRows } = await client.query<{ count: string }>(
      "SELECT COUNT(*) AS count FROM products"
    );
    const existing = parseInt(countRows[0].count, 10);
    if (existing > 0) {
      logger.info(`products table already has ${existing} rows — skipping blob migration`);
      return;
    }

    // Fetch site-content blob
    const { rows } = await client.query<{ data: any }>(
      "SELECT data FROM site_content WHERE key = $1",
      ["jqf_site_content_v1"]
    );
    if (!rows.length) {
      logger.info("No site-content blob found — skipping blob migration");
      return;
    }

    const blob = rows[0].data as any;
    const products: LegacyProduct[] = blob?.shop?.products ?? [];
    if (!products.length) {
      logger.info("No products found in blob — skipping blob migration");
      return;
    }

    logger.info(`Migrating ${products.length} products from site-content blob`);

    await client.query("BEGIN");
    for (const p of products) {
      const id = p.id && p.id.length > 4 ? p.id : randomUUID();
      const images = p.image ? [p.image] : [];

      await client.query(
        `INSERT INTO products
           (id, name, category, price, old_price, rating, badge, images, stock, sku, active, condition, verified, description)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'Used-Good',TRUE,'')
         ON CONFLICT (sku) DO NOTHING`,
        [id, p.name, p.category, p.price, p.oldPrice ?? null, p.rating, p.badge ?? null, images, p.stock, p.sku, p.active]
      );

      await client.query(
        `INSERT INTO inventory (product_id, quantity, threshold)
         VALUES ($1, $2, 2)
         ON CONFLICT (product_id) DO NOTHING`,
        [id, p.stock]
      );
    }
    await client.query("COMMIT");
    logger.info("Blob migration complete");
  } catch (err) {
    await client.query("ROLLBACK");
    logger.error({ err }, "Blob migration failed");
  } finally {
    client.release();
  }
}
