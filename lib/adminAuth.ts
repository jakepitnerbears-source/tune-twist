import { cookies } from "next/headers";
import { verifyToken } from "./sessionToken";

export const ADMIN_SESSION_COOKIE = "admin_session";
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/**
 * Shared by proxy.ts (which can't import next/headers) and Server Functions. Accepts the raw
 * cookie string so proxy.ts can read it straight off the request without touching next/headers.
 */
export function isValidAdminSession(cookieValue: string | undefined | null): boolean {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return false; // missing env var fails closed, not open
  return verifyToken(secret, cookieValue, Date.now() / 1000) !== null;
}

/**
 * For Server Functions under /admin/** — defense in depth behind proxy.ts's admin_session
 * gate. Content Manager lives under /admin and should be exactly as protected as every
 * other /admin/* route, no weaker and no separately-gated.
 */
export async function hasAdminAccess(): Promise<boolean> {
  const jar = await cookies();
  return isValidAdminSession(jar.get(ADMIN_SESSION_COOKIE)?.value);
}
