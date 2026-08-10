import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const repairTicketsTable = pgTable("repair_tickets", {
  id: text("id").primaryKey(),
  ticket: text("ticket").notNull(),
  category: text("category").notNull(),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  issue: text("issue").notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull().default(""),
  date: text("date").notNull().default(""),
  status: text("status").notNull().default("Checked In"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRepairTicketSchema = createInsertSchema(repairTicketsTable).omit({
  createdAt: true,
});

export type InsertRepairTicket = z.infer<typeof insertRepairTicketSchema>;
export type RepairTicket = typeof repairTicketsTable.$inferSelect;
