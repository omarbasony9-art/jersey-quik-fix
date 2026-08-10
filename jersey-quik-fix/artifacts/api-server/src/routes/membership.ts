import { Router } from "express";
import { db, membershipCodesTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";
import { getUncachableStripeClient } from "../stripeClient";

const membershipRouter = Router();

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part = (n: number) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `JQF-${part(4)}-${part(4)}`;
}

// POST /api/membership/activate
// Called after Stripe checkout success — verifies session and generates code
membershipRouter.post("/membership/activate", async (req, res): Promise<void> => {
  const { sessionId, email } = req.body as { sessionId?: string; email?: string };
  if (!sessionId) {
    res.status(400).json({ error: "Session ID required" });
    return;
  }

  try {
    // Return existing code for this session (idempotent)
    const existing = await db
      .select()
      .from(membershipCodesTable)
      .where(eq(membershipCodesTable.stripeSessionId, sessionId));
    if (existing.length > 0) {
      res.json({ code: existing[0].code, email: existing[0].email, discountPercent: existing[0].discountPercent });
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

    // Generate a unique code
    let code = generateCode();
    for (let i = 0; i < 20; i++) {
      const clash = await db
        .select()
        .from(membershipCodesTable)
        .where(eq(membershipCodesTable.code, code));
      if (clash.length === 0) break;
      code = generateCode();
    }

    await db.insert(membershipCodesTable).values({
      id: crypto.randomUUID(),
      email: customerEmail.toLowerCase(),
      code,
      stripeSessionId: sessionId,
      discountPercent: 10,
      isActive: true,
    });

    res.json({ code, email: customerEmail, discountPercent: 10 });
  } catch (err: any) {
    console.error("Membership activate error:", err.message);
    res.status(500).json({ error: "Failed to activate membership" });
  }
});

// POST /api/membership/validate
// Check if a promo code is valid and return the discount
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

    if (rows.length === 0 || !rows[0].isActive) {
      res.json({ valid: false, message: "Code not found or inactive." });
      return;
    }

    res.json({
      valid: true,
      discountPercent: rows[0].discountPercent,
      message: `JQF+ Member code applied — ${rows[0].discountPercent}% off!`,
    });
  } catch (err: any) {
    console.error("Membership validate error:", err.message);
    res.status(500).json({ error: "Failed to validate code" });
  }
});

// GET /api/membership/lookup?email=xxx
// Look up membership codes by email (for members who lost their code)
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

    const active = rows.filter(r => r.isActive);
    if (active.length === 0) {
      res.json({ found: false, message: "No active membership found for that email." });
      return;
    }

    res.json({
      found: true,
      code: active[0].code,
      discountPercent: active[0].discountPercent,
    });
  } catch (err: any) {
    console.error("Membership lookup error:", err.message);
    res.status(500).json({ error: "Failed to look up membership" });
  }
});

export default membershipRouter;
