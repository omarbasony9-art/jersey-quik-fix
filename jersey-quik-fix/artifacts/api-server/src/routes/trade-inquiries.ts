import { Router } from "express";
import { db } from "@workspace/db";
import { tradeInquiries } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAdminAuth } from "../middleware/adminAuth";

const tradeRouter = Router();

// POST /api/trade-inquiries — public
tradeRouter.post("/trade-inquiries", async (req, res): Promise<void> => {
  const { name, email, phone, deviceType, deviceDescription, condition, notes } = req.body;

  if (!name || !email || !phone || !deviceType || !deviceDescription || !condition) {
    res.status(400).json({ error: "All required fields must be provided." });
    return;
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    res.status(400).json({ error: "Invalid email address." });
    return;
  }

  try {
    const [inquiry] = await db
      .insert(tradeInquiries)
      .values({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        deviceType,
        deviceDescription: deviceDescription.trim(),
        condition,
        notes: notes?.trim() || null,
      })
      .returning();
    res.status(201).json(inquiry);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/trade-inquiries — admin only
tradeRouter.get("/trade-inquiries", requireAdminAuth, async (_req, res): Promise<void> => {
  try {
    const rows = await db
      .select()
      .from(tradeInquiries)
      .orderBy(desc(tradeInquiries.createdAt));
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/trade-inquiries/:id — update status, admin only
tradeRouter.patch("/trade-inquiries/:id", requireAdminAuth, async (req, res): Promise<void> => {
  const { status } = req.body;
  const id = parseInt(req.params.id, 10);
  if (!status || isNaN(id)) {
    res.status(400).json({ error: "Invalid request." });
    return;
  }

  try {
    const [updated] = await db
      .update(tradeInquiries)
      .set({ status })
      .where(eq(tradeInquiries.id, id))
      .returning();
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/trade-inquiries/:id — admin only
tradeRouter.delete("/trade-inquiries/:id", requireAdminAuth, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id." });
    return;
  }

  try {
    await db.delete(tradeInquiries).where(eq(tradeInquiries.id, id));
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default tradeRouter;
