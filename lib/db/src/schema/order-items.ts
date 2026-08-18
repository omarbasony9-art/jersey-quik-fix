import { pgTable, serial, text, decimal, integer, timestamp } from "drizzle-orm/pg-core";

export const orderItemsTable = pgTable("order_items", {
  id:           serial("id").primaryKey(),
  orderId:      text("order_id").notNull(),
  productId:    text("product_id").notNull(),
  productName:  text("product_name").notNull(),
  productImage: text("product_image"),
  price:        decimal("price", { precision: 10, scale: 2 }).notNull(),
  quantity:     integer("quantity").notNull().default(1),
  createdAt:    timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type OrderItem    = typeof orderItemsTable.$inferSelect;
export type NewOrderItem = typeof orderItemsTable.$inferInsert;
