import { pgTable, text, decimal, jsonb, timestamp } from "drizzle-orm/pg-core";

export const ordersTable = pgTable("orders", {
  id:              text("id").primaryKey(),
  stripeSessionId: text("stripe_session_id").notNull().unique(),
  customerEmail:   text("customer_email").notNull().default(""),
  customerName:    text("customer_name").notNull().default(""),
  total:           decimal("total", { precision: 10, scale: 2 }).notNull(),
  status:          text("status").notNull().default("paid"), // paid | packed | shipped | delivered | cancelled
  shippingAddress: jsonb("shipping_address"),
  createdAt:       timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:       timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Order    = typeof ordersTable.$inferSelect;
export type NewOrder = typeof ordersTable.$inferInsert;
