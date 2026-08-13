/**
 * WebCrypto HMAC-SHA256 admin token — behaviorally identical to the Express
 * server's Node crypto.createHmac implementation.  Tokens issued by either
 * backend are mutually compatible (same format: `<timestamp>.<hex-sig>`).
 */

const EXPIRY_MS = 8 * 60 * 60 * 1000; // 8 hours

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function hmacHex(secret: string, data: string): Promise<string> {
  const key = await importKey(secret);
  const buf = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(data),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createAdminToken(secret: string): Promise<string> {
  const ts = String(Date.now());
  const sig = await hmacHex(secret, ts);
  return `${ts}.${sig}`;
}

export async function verifyAdminToken(
  token: string,
  secret: string,
): Promise<boolean> {
  if (!secret) return false;
  const dot = token.lastIndexOf(".");
  if (dot < 1) return false;
  const ts = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = await hmacHex(secret, ts);

  // Constant-time comparison
  if (sig.length !== expected.length || sig.length === 0) return false;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) {
    diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  if (diff !== 0) return false;

  const age = Date.now() - Number(ts);
  return age >= 0 && age < EXPIRY_MS;
}
