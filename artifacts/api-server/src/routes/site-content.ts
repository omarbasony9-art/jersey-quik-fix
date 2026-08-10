import { Router } from "express";
import { db, siteContentTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdminAuth } from "../middleware/adminAuth";

const siteContentRouter = Router();

const CONTENT_KEY = "jqf_site_content_v1";

// GET /api/site-content — public read for site rendering
siteContentRouter.get("/site-content", async (_req, res): Promise<void> => {
  try {
    const rows = await db
      .select()
      .from(siteContentTable)
      .where(eq(siteContentTable.key, CONTENT_KEY));
    if (rows.length === 0) {
      res.json(null);
      return;
    }
    res.json(rows[0].data);
  } catch (_err) {
    res.status(500).json({ error: "Failed to load site content" });
  }
});

// PUT /api/site-content — admin only write
siteContentRouter.put("/site-content", requireAdminAuth, async (req, res): Promise<void> => {
  const data = req.body as unknown;
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    res.status(400).json({ error: "Invalid data" });
    return;
  }
  try {
    await db
      .insert(siteContentTable)
      .values({ key: CONTENT_KEY, data })
      .onConflictDoUpdate({ target: siteContentTable.key, set: { data } });
    res.json({ ok: true });
  } catch (_err) {
    res.status(500).json({ error: "Failed to save site content" });
  }
});

export default siteContentRouter;
