import type { Context } from "hono";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type LoginEntry = {
  failures: number;
  lastFailureAt: number;
  blockedUntil: number;
};

const rateLimits = new Map<string, RateLimitEntry>();
const loginAttempts = new Map<string, LoginEntry>();
let operationsSinceCleanup = 0;

function clientIp(c: Context): string {
  return (
    c.req.header("cf-connecting-ip") ||
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

async function clientKey(c: Context, scope: string): Promise<string> {
  const input = new TextEncoder().encode(`${scope}:${clientIp(c)}`);
  const digest = await crypto.subtle.digest("SHA-256", input);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

function cleanup(now: number) {
  operationsSinceCleanup += 1;
  if (operationsSinceCleanup < 250) return;
  operationsSinceCleanup = 0;

  for (const [key, value] of rateLimits) {
    if (value.resetAt <= now) rateLimits.delete(key);
  }
  for (const [key, value] of loginAttempts) {
    if (value.blockedUntil <= now && now - value.lastFailureAt > 60 * 60 * 1000) {
      loginAttempts.delete(key);
    }
  }
}

export function consumeRateLimit(
  c: Context,
  scope: string,
  limit: number,
  windowMs: number,
): { allowed: true } | { allowed: false; retryAfterSeconds: number } {
  const now = Date.now();
  cleanup(now);
  const key = `${scope}:${clientIp(c)}`;
  const current = rateLimits.get(key);

  if (!current || current.resetAt <= now) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  current.count += 1;
  if (current.count <= limit) return { allowed: true };

  return {
    allowed: false,
    retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  };
}

export async function consumeCloudflareRateLimit(
  c: Context,
  scope: string,
  limiter: RateLimit,
  retryAfterSeconds: number,
): Promise<{ allowed: true } | { allowed: false; retryAfterSeconds: number }> {
  const key = `${scope}:${clientIp(c)}`;
  const result = await limiter.limit({ key });
  return result.success
    ? { allowed: true }
    : { allowed: false, retryAfterSeconds };
}

export async function consumePersistentRateLimit(
  c: Context,
  db: D1Database,
  scope: string,
  limit: number,
  windowMs: number,
): Promise<{ allowed: true } | { allowed: false; retryAfterSeconds: number }> {
  const now = Date.now();
  const expiredBefore = now - windowMs;
  const key = await clientKey(c, scope);
  const row = await db
    .prepare(
      `INSERT INTO security_rate_limits
         (key, window_start, request_count, updated_at)
       VALUES (?, ?, 1, ?)
       ON CONFLICT(key) DO UPDATE SET
         window_start = CASE
           WHEN security_rate_limits.window_start <= ? THEN excluded.window_start
           ELSE security_rate_limits.window_start
         END,
         request_count = CASE
           WHEN security_rate_limits.window_start <= ? THEN 1
           ELSE security_rate_limits.request_count + 1
         END,
         updated_at = excluded.updated_at
       RETURNING window_start, request_count`,
    )
    .bind(key, now, now, expiredBefore, expiredBefore)
    .first<{ window_start: number; request_count: number }>();

  if (!row || row.request_count <= limit) return { allowed: true };
  return {
    allowed: false,
    retryAfterSeconds: Math.max(
      1,
      Math.ceil((row.window_start + windowMs - now) / 1000),
    ),
  };
}

export function checkAdminLoginAllowed(
  c: Context,
): { allowed: true } | { allowed: false; retryAfterSeconds: number } {
  const now = Date.now();
  cleanup(now);
  const current = loginAttempts.get(clientIp(c));
  if (!current || current.blockedUntil <= now) return { allowed: true };
  return {
    allowed: false,
    retryAfterSeconds: Math.max(1, Math.ceil((current.blockedUntil - now) / 1000)),
  };
}

export function recordAdminLoginFailure(c: Context): number {
  const now = Date.now();
  const ip = clientIp(c);
  const existing = loginAttempts.get(ip);
  const failures =
    !existing || now - existing.lastFailureAt > 15 * 60 * 1000
      ? 1
      : existing.failures + 1;
  const lockSeconds =
    failures < 5 ? 0 : Math.min(15 * 60, 30 * 2 ** Math.min(failures - 5, 5));

  loginAttempts.set(ip, {
    failures,
    lastFailureAt: now,
    blockedUntil: now + lockSeconds * 1000,
  });
  return lockSeconds;
}

export function clearAdminLoginFailures(c: Context) {
  loginAttempts.delete(clientIp(c));
}

export async function readJsonBody<T>(
  c: Context,
  maxBytes: number,
): Promise<T> {
  const declaredLength = Number(c.req.header("content-length") || "0");
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new RequestBodyError("Request body is too large", 413);
  }

  const raw = await c.req.text();
  if (new TextEncoder().encode(raw).byteLength > maxBytes) {
    throw new RequestBodyError("Request body is too large", 413);
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new RequestBodyError("Invalid JSON request", 400);
  }
}

export class RequestBodyError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 413,
  ) {
    super(message);
  }
}

export function boundedString(
  value: unknown,
  field: string,
  maxLength: number,
  required = false,
): string {
  if (value === undefined || value === null) {
    if (required) throw new Error(`${field} is required`);
    return "";
  }
  if (typeof value !== "string") throw new Error(`${field} must be text`);
  const normalized = value.trim();
  if (required && !normalized) throw new Error(`${field} is required`);
  if (normalized.length > maxLength) {
    throw new Error(`${field} must be ${maxLength} characters or fewer`);
  }
  return normalized;
}