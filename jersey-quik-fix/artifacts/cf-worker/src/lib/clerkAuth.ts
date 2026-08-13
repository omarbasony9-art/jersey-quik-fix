import { verifyToken } from "@clerk/backend";

/**
 * Verify a Clerk session token from an Authorization: Bearer header.
 * Returns the userId if valid, null otherwise.
 */
export async function verifyClerkToken(
  token: string,
  env: { CLERK_SECRET_KEY: string; CLERK_PUBLISHABLE_KEY: string },
): Promise<string | null> {
  try {
    const payload = await verifyToken(token, {
      secretKey: env.CLERK_SECRET_KEY,
    });
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

/**
 * Extract Bearer token from Authorization header.
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  return token || null;
}
