import { pgTable, text, jsonb } from "drizzle-orm/pg-core";

export const siteContentTable = pgTable("site_content", {
  key: text("key").primaryKey(),
  data: jsonb("data").notNull(),
});

export type SiteContentRow = typeof siteContentTable.$inferSelect;
