import { pgTable, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";

export const membershipCodesTable = pgTable("membership_codes", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  userId: text("user_id"),
  code: text("code").notNull().unique(),
  stripeSessionId: text("stripe_session_id").unique(),
  discountPercent: integer("discount_percent").notNull().default(10),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type MembershipCode = typeof membershipCodesTable.$inferSelect;
