import { Router } from "express";
import { db, repairTicketsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdminAuth } from "../middleware/adminAuth";
import { randomUUID } from "crypto";

const repairsRouter = Router();

function generateTicketNumber(): string {
  return "JQ-" + String(Math.floor(100000 + Math.random() * 900000));
}

// GET /api/repairs — list all tickets, newest first (admin only)
repairsRouter.get("/repairs", requireAdminAuth, async (_req, res): Promise<void> => {
  try {
    const tickets = await db
      .select()
      .from(repairTicketsTable)
      .orderBy(repairTicketsTable.createdAt);
    res.json(tickets);
  } catch (_err) {
    res.status(500).json({ error: "Failed to load repair tickets" });
  }
});

// POST /api/repairs — create a new ticket (public — customer form)
// id, ticket number, and status are generated server-side; client fields are validated
repairsRouter.post("/repairs", async (req, res): Promise<void> => {
  const { category, brand, model, issue, name, phone, email, date } = req.body as Record<string, string>;
  if (!name || !phone || !model) {
    res.status(400).json({ error: "name, phone, and model are required" });
    return;
  }
  try {
    const [created] = await db
      .insert(repairTicketsTable)
      .values({
        id: randomUUID(),
        ticket: generateTicketNumber(),
        category: category ?? "Other",
        brand: brand ?? "Other",
        model,
        issue: issue ?? "Other",
        name,
        phone,
        email: email ?? "",
        date: date ?? "",
        status: "Checked In",
      })
      .returning();
    res.status(201).json(created);
  } catch (_err) {
    res.status(500).json({ error: "Failed to create repair ticket" });
  }
});

// PATCH /api/repairs/:id/status — update ticket status (admin only)
repairsRouter.patch("/repairs/:id/status", requireAdminAuth, async (req, res): Promise<void> => {
  const id = String(req.params["id"]);
  const { status } = req.body as { status?: string };
  if (!status) {
    res.status(400).json({ error: "Missing status" });
    return;
  }
  try {
    const [updated] = await db
      .update(repairTicketsTable)
      .set({ status })
      .where(eq(repairTicketsTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }
    res.json(updated);
  } catch (_err) {
    res.status(500).json({ error: "Failed to update ticket" });
  }
});

// GET /api/repairs/lookup/:ticketCode — public status lookup by ticket code (e.g. JQ-123456)
repairsRouter.get("/repairs/lookup/:ticketCode", async (req, res): Promise<void> => {
  const ticketCode = String(req.params["ticketCode"]).toUpperCase().trim();
  try {
    const tickets = await db
      .select()
      .from(repairTicketsTable)
      .where(eq(repairTicketsTable.ticket, ticketCode));
    if (!tickets.length) {
      res.status(404).json({ error: "No ticket found with that code." });
      return;
    }
    const t = tickets[0];
    // Return safe public fields — no full phone/email exposure
    res.json({
      ticket: t.ticket,
      category: t.category,
      brand: t.brand,
      model: t.model,
      issue: t.issue,
      status: t.status,
      date: t.date,
      createdAt: t.createdAt,
      // Show only first name for privacy
      name: t.name ? t.name.split(" ")[0] : "",
    });
  } catch (_err) {
    res.status(500).json({ error: "Failed to look up ticket" });
  }
});

// DELETE /api/repairs/:id — delete a ticket (admin only)
repairsRouter.delete("/repairs/:id", requireAdminAuth, async (req, res): Promise<void> => {
  const id = String(req.params["id"]);
  try {
    await db.delete(repairTicketsTable).where(eq(repairTicketsTable.id, id));
    res.json({ ok: true });
  } catch (_err) {
    res.status(500).json({ error: "Failed to delete ticket" });
  }
});

export default repairsRouter;
