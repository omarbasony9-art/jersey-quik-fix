import { pgTable, text, decimal, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";

export const productsTable = pgTable("products", {
  id:               text("id").primaryKey(),
  name:             text("name").notNull(),
  category:         text("category").notNull(),
  subcategory:      text("subcategory"),
  description:      text("description").notNull().default(""),
  price:            decimal("price", { precision: 10, scale: 2 }).notNull(),
  oldPrice:         decimal("old_price", { precision: 10, scale: 2 }),
  priceNote:        text("price_note"),          // admin-visible estimate note
  condition:        text("condition").notNull().default("Used-Good"),
  configuration:    jsonb("configuration"),       // variant options (storage, specs, etc.)
  stock:            integer("stock").notNull().default(1),
  sku:              text("sku").notNull().unique(),
  images:           text("images").array().notNull().default([]),
  badge:            text("badge"),
  rating:           decimal("rating", { precision: 3, scale: 1 }).notNull().default("4.5"),
  active:           boolean("active").notNull().default(true),
  featured:         boolean("featured").notNull().default(false),
  verified:         boolean("verified").notNull().default(true),
  verificationNote: text("verification_note"),
  createdAt:        timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:        timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Product    = typeof productsTable.$inferSelect;
export type NewProduct = typeof productsTable.$inferInsert;
