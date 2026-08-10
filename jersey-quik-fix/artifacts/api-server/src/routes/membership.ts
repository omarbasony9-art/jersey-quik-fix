import { Router } from "express";
import { db, membershipCodesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { getUncachableStripeClient } from "../stripeClient";
import { requireAdminAuth } from "../middleware/adminAuth";

const membershipRouter = Router();

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part = (n: number) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `JQF-${part(4)}-${part(4)}`;
}

function oneYearFromNow(): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d;
}

// ── Public routes ────────────────────────────────────────────────────────────

// POST /api/membership/activate
// Called after Stripe checkout — verifies session, generates code with 1-year expiry
membershipRouter.post("/membership/activate", async (req, res): Promise<void> => {
  const { sessionId, email } = req.body as { sessionId?: string; email?: string };
  if (!sessionId) {
    res.status(400).json({ error: "Session ID required" });
    return;
  }

  try {
    // Idempotent — return existing code if already activated
    const existing = await db
      .select()
      .from(membershipCodesTable)
      .where(eq(membershipCodesTable.stripeSessionId, sessionId));
    if (existing.length > 0) {
      res.json({
        code: existing[0].code,
        email: existing[0].email,
        discountPercent: existing[0].discountPercent,
        expiresAt: existing[0].expiresAt,
      });
      return;
    }

    // Verify with Stripe
    const stripe = await getUncachableStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      res.status(400).json({ error: "Payment not completed" });
      return;
    }

    if (session.metadata?.hasMembership !== "true") {
      res.status(400).json({ error: "No membership in this order" });
      return;
    }

    const customerEmail =
      email ||
      session.customer_details?.email ||
      session.metadata?.customerEmail ||
      "";

    if (!customerEmail) {
      res.status(400).json({ error: "Customer email required" });
      return;
    }

    // Generate unique code
    let code = generateCode();
    for (let i = 0; i < 20; i++) {
      const clash = await db
        .select()
        .from(membershipCodesTable)
        .where(eq(membershipCodesTable.code, code));
      if (clash.length === 0) break;
      code = generateCode();
    }

    const expiresAt = oneYearFromNow();

    await db.insert(membershipCodesTable).values({
      id: crypto.randomUUID(),
      email: customerEmail.toLowerCase(),
      code,
      stripeSessionId: sessionId,
      discountPercent: 10,
      isActive: true,
      expiresAt,
    });

    res.json({ code, email: customerEmail, discountPercent: 10, expiresAt });
  } catch (err: any) {
    console.error("Membership activate error:", err.message);
    res.status(500).json({ error: "Failed to activate membership" });
  }
});

// POST /api/membership/validate
// Check if a code is valid, active, and not expired
membershipRouter.post("/membership/validate", async (req, res): Promise<void> => {
  const { code } = req.body as { code?: string };
  if (!code) {
    res.status(400).json({ error: "Code required" });
    return;
  }

  try {
    const rows = await db
      .select()
      .from(membershipCodesTable)
      .where(eq(membershipCodesTable.code, code.toUpperCase().trim()));

    if (rows.length === 0) {
      res.json({ valid: false, message: "Code not found." });
      return;
    }

    const row = rows[0];
    const now = new Date();

    if (!row.isActive) {
      res.json({ valid: false, message: "This code has been deactivated." });
      return;
    }

    if (row.expiresAt && new Date(row.expiresAt) < now) {
      const expired = new Date(row.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      res.json({ valid: false, message: `Code expired on ${expired}.` });
      return;
    }

    const daysLeft = row.expiresAt
      ? Math.ceil((new Date(row.expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    res.json({
      valid: true,
      discountPercent: row.discountPercent,
      expiresAt: row.expiresAt,
      daysLeft,
      message: `JQF+ Member code applied — ${row.discountPercent}% off! Expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.`,
    });
  } catch (err: any) {
    console.error("Membership validate error:", err.message);
    res.status(500).json({ error: "Failed to validate code" });
  }
});

// GET /api/membership/lookup?email=xxx
// Look up active codes by email
membershipRouter.get("/membership/lookup", async (req, res): Promise<void> => {
  const email = req.query.email as string;
  if (!email) {
    res.status(400).json({ error: "Email required" });
    return;
  }

  try {
    const rows = await db
      .select()
      .from(membershipCodesTable)
      .where(eq(membershipCodesTable.email, email.toLowerCase().trim()));

    const now = new Date();
    const active = rows.filter(r => r.isActive && new Date(r.expiresAt) > now);

    if (active.length === 0) {
      res.json({ found: false, message: "No active membership found for that email." });
      return;
    }

    res.json({
      found: true,
      code: active[0].code,
      discountPercent: active[0].discountPercent,
      expiresAt: active[0].expiresAt,
    });
  } catch (err: any) {
    console.error("Membership lookup error:", err.message);
    res.status(500).json({ error: "Failed to look up membership" });
  }
});

// ── Admin routes ─────────────────────────────────────────────────────────────

// GET /api/admin/membership-codes — list all codes
membershipRouter.get("/admin/membership-codes", requireAdminAuth, async (_req, res): Promise<void> => {
  try {
    const rows = await db
      .select()
      .from(membershipCodesTable)
      .orderBy(desc(membershipCodesTable.createdAt));
    res.json(rows);
  } catch (err: any) {
    console.error("Admin membership list error:", err.message);
    res.status(500).json({ error: "Failed to load membership codes" });
  }
});

// PATCH /api/admin/membership-codes/:id — toggle isActive
membershipRouter.patch("/admin/membership-codes/:id", requireAdminAuth, async (req, res): Promise<void> => {
  const { id } = req.params;
  const { isActive } = req.body as { isActive?: boolean };
  if (typeof isActive !== "boolean") {
    res.status(400).json({ error: "isActive (boolean) required" });
    return;
  }
  try {
    await db
      .update(membershipCodesTable)
      .set({ isActive })
      .where(eq(membershipCodesTable.id, id));
    res.json({ ok: true });
  } catch (err: any) {
    console.error("Admin membership patch error:", err.message);
    res.status(500).json({ error: "Failed to update membership code" });
  }
});

export default membershipRouter;
