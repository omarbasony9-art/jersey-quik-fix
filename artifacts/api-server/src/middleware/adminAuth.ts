import { Request, Response, NextFunction } from "express";
import { verifyAdminToken } from "../lib/adminToken";

/**
 * Middleware that validates a Bearer token (issued by POST /api/admin/login)
 * and signed with SESSION_SECRET. Protects admin-only endpoints.
 */
export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers["authorization"];
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = auth.slice(7);
  if (!verifyAdminToken(token)) {
    res.status(401).json({ error: "Session expired or invalid" });
    return;
  }
  next();
}
