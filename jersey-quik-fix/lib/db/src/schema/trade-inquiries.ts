import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const tradeInquiries = pgTable("trade_inquiries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  deviceType: text("device_type").notNull(),
  deviceDescription: text("device_description").notNull(),
  condition: text("condition").notNull(),
  notes: text("notes"),
  status: text("status").notNull().default("New"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
