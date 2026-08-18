import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const inventoryTable = pgTable("inventory", {
  id:        serial("id").primaryKey(),
  productId: text("product_id").notNull().unique(),   // 1-to-1 with products
  quantity:  integer("quantity").notNull().default(0),
  reserved:  integer("reserved").notNull().default(0),
  threshold: integer("threshold").notNull().default(2), // low-stock warning level
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type InventoryRow    = typeof inventoryTable.$inferSelect;
export type NewInventoryRow = typeof inventoryTable.$inferInsert;
