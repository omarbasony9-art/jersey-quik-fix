import type { Hono } from "hono";
import type { Env } from "../types";
import { requireAdmin } from "../middleware/adminAuth";
import Stripe from "stripe";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateCode(): string {
  const part = (n: number) =>
    Array.from(
      { length: n },
      () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)],
    ).join("");
  return `JQF-${part(4)}-${part(4)}`;
}

function oneYearFromNow(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString();
}

export function registerMembership(app: Hono<{ Bindings: Env }>) {
  // POST /api/membership/activate — verify Stripe session → issue code
  app.post("/api/membership/activate", async (c) => {
    const { sessionId, email } = await c.req.json<{
      sessionId?: string;
      email?: string;
    }>();
    if (!sessionId) return c.json({ error: "Session ID required" }, 400);

    // Idempotent: return existing code if already activated
    const existing = await c.env.DB.prepare(
      "SELECT * FROM membership_codes WHERE stripe_session_id = ?",
    )
      .bind(sessionId)
      .first<{
        code: string;
        email: string;
        discount_percent: number;
        expires_at: string;
      }>();
    if (existing) {
      return c.json({
        code: existing.code,
        email: existing.email,
        discountPercent: existing.discount_percent,
        expiresAt: existing.expires_at,
      });
    }

    try {
      const stripe = new Stripe(c.env.STRIPE_SECRET_KEY);
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status !== "paid") {
        return c.json({ error: "Payment not completed" }, 400);
      }
      if (session.metadata?.hasMembership !== "true") {
        return c.json({ error: "No membership in this order" }, 400);
      }

      const customerEmail =
        email ||
        session.customer_details?.email ||
        session.metadata?.customerEmail ||
        "";
      if (!customerEmail) {
        return c.json({ error: "Customer email required" }, 400);
      }

      // Generate unique code (up to 20 collision attempts)
      let code = generateCode();
      for (let i = 0; i < 20; i++) {
        const clash = await c.env.DB.prepare(
          "SELECT id FROM membership_codes WHERE code = ?",
        )
          .bind(code)
          .first();
        if (!clash) break;
        code = generateCode();
      }

      const id = crypto.randomUUID();
      const expiresAt = oneYearFromNow();
      const now = new Date().toISOString();

      await c.env.DB.prepare(
        `INSERT INTO membership_codes
           (id, email, code, stripe_session_id, discount_percent, is_active, created_at, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
        .bind(
          id,
          customerEmail.toLowerCase(),
          code,
          sessionId,
          10,
          1,
          now,
          expiresAt,
        )
        .run();

      return c.json({
        code,
        email: customerEmail,
        discountPercent: 10,
        expiresAt,
      });
    } catch (err: unknown) {
      console.error(
        "Membership activate error:",
        err instanceof Error ? err.message : err,
      );
      return c.json({ error: "Failed to activate membership" }, 500);
    }
  });

  // POST /api/membership/validate — check if code is valid
  app.post("/api/membership/validate", async (c) => {
    const { code } = await c.req.json<{ code?: string }>();
    if (!code) return c.json({ error: "Code required" }, 400);

    const row = await c.env.DB.prepare(
      "SELECT * FROM membership_codes WHERE code = ?",
    )
      .bind(code.toUpperCase().trim())
      .first<{
        is_active: number;
        expires_at: string;
        discount_percent: number;
      }>();

    if (!row) return c.json({ valid: false, message: "Code not found." });

    if (!row.is_active) {
      return c.json({ valid: false, message: "This code has been deactivated." });
    }

    const now = new Date();
    if (row.expires_at && new Date(row.expires_at) < now) {
      const expired = new Date(row.expires_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      return c.json({ valid: false, message: `Code expired on ${expired}.` });
    }

    const daysLeft = row.expires_at
      ? Math.ceil(
          (new Date(row.expires_at).getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : null;

    return c.json({
      valid: true,
      discountPercent: row.discount_percent,
      expiresAt: row.expires_at,
      daysLeft,
      message: `JQF+ Member code applied — ${row.discount_percent}% off! Expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.`,
    });
  });

  // GET /api/membership/lookup?email=xxx — look up by email
  app.get("/api/membership/lookup", async (c) => {
    const email = c.req.query("email");
    if (!email) return c.json({ error: "Email required" }, 400);

    const { results } = await c.env.DB.prepare(
      "SELECT * FROM membership_codes WHERE email = ?",
    )
      .bind(email.toLowerCase().trim())
      .all<{ is_active: number; expires_at: string; code: string; discount_percent: number }>();

    const now = new Date();
    const active = results.filter(
      (r) => r.is_active && new Date(r.expires_at) > now,
    );

    if (active.length === 0) {
      return c.json({
        found: false,
        message: "No active membership found for that email.",
      });
    }

    return c.json({
      found: true,
      code: active[0].code,
      discountPercent: active[0].discount_percent,
      expiresAt: active[0].expires_at,
    });
  });

  // GET /api/admin/membership-codes — admin only
  app.get("/api/admin/membership-codes", requireAdmin, async (c) => {
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM membership_codes ORDER BY created_at DESC",
    ).all();
    return c.json(results);
  });

  // PATCH /api/admin/membership-codes/:id — toggle isActive
  app.patch("/api/admin/membership-codes/:id", requireAdmin, async (c) => {
    const id = c.req.param("id");
    const { isActive } = await c.req.json<{ isActive?: boolean }>();
    if (typeof isActive !== "boolean") {
      return c.json({ error: "isActive (boolean) required" }, 400);
    }
    await c.env.DB.prepare(
      "UPDATE membership_codes SET is_active = ? WHERE id = ?",
    )
      .bind(isActive ? 1 : 0, id)
      .run();
    return c.json({ ok: true });
  });
}
