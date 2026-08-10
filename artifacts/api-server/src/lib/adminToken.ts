import { createHmac, timingSafeEqual } from "crypto";

const SECRET = process.env.SESSION_SECRET ?? "";
const EXPIRY_MS = 8 * 60 * 60 * 1000; // 8 hours

export function createAdminToken(): string {
  const ts = String(Date.now());
  const sig = createHmac("sha256", SECRET).update(ts).digest("hex");
  return `${ts}.${sig}`;
}

export function verifyAdminToken(token: string): boolean {
  if (!SECRET) return false;
  const dotIndex = token.lastIndexOf(".");
  if (dotIndex < 1) return false;
  const ts = token.slice(0, dotIndex);
  const sig = token.slice(dotIndex + 1);
  const expected = createHmac("sha256", SECRET).update(ts).digest("hex");
  try {
    const sigBuf = Buffer.from(sig, "hex");
    const expectedBuf = Buffer.from(expected, "hex");
    if (sigBuf.length === 0 || sigBuf.length !== expectedBuf.length) return false;
    if (!timingSafeEqual(sigBuf, expectedBuf)) return false;
  } catch {
    return false;
  }
  const age = Date.now() - Number(ts);
  return age >= 0 && age < EXPIRY_MS;
}
