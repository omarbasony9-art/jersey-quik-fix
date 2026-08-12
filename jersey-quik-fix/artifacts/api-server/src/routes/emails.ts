import { Router } from "express";
import { db, emailSubscribersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAdminAuth } from "../middleware/adminAuth";
import { randomUUID } from "crypto";

const emailsRouter = Router();

// POST /api/emails/subscribe — public, customer submits their email
emailsRouter.post("/emails/subscribe", async (req, res): Promise<void> => {
  const { email, name, source } = req.body as Record<string, string>;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "A valid email address is required" });
    return;
  }
  try {
    const [created] = await db
      .insert(emailSubscribersTable)
      .values({
        id: randomUUID(),
        email: email.toLowerCase().trim(),
        name: name?.trim() ?? "",
        source: source ?? "website",
      })
      .onConflictDoNothing()
      .returning();

    if (!created) {
      // Already subscribed — treat as success (no leaking info)
      res.json({ ok: true, message: "Already subscribed" });
      return;
    }

    res.json({ ok: true, message: "Subscribed successfully" });
  } catch (_err) {
    res.status(500).json({ error: "Failed to subscribe" });
  }
});

// GET /api/emails — admin only, list all subscribers newest first
emailsRouter.get("/emails", requireAdminAuth, async (_req, res): Promise<void> => {
  try {
    const subscribers = await db
      .select()
      .from(emailSubscribersTable)
      .orderBy(desc(emailSubscribersTable.createdAt));
    res.json(subscribers);
  } catch (_err) {
    res.status(500).json({ error: "Failed to load subscribers" });
  }
});

// DELETE /api/emails/:id — admin only
emailsRouter.delete("/emails/:id", requireAdminAuth, async (req, res): Promise<void> => {
  const { id } = req.params;
  try {
    await db.delete(emailSubscribersTable).where(eq(emailSubscribersTable.id, id));
    res.json({ ok: true });
  } catch (_err) {
    res.status(500).json({ error: "Failed to delete subscriber" });
  }
});

export default emailsRouter;
