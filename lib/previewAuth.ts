import { cookies } from "next/headers";
import { verifyToken } from "./sessionToken";

export const PREVIEW_COOKIE = "quiz_preview_session";
export const PREVIEW_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days — short-lived on purpose, this gate sits in front of unpublished content

/**
 * Shared by proxy.ts (raw cookie string, no next/headers there) and Server Functions.
 */
export function isValidPreviewToken(cookieValue: string | undefined | null): boolean {
  const secret = process.env.QUIZ_PREVIEW_SESSION_SECRET;
  if (!secret) return false; // missing env var fails closed, not open
  return verifyToken(secret, cookieValue, Date.now() / 1000) !== null;
}

/** For Server Components / Route Handlers — defense in depth behind proxy.ts's gate. */
export async function hasPreviewAccess(): Promise<boolean> {
  const jar = await cookies();
  return isValidPreviewToken(jar.get(PREVIEW_COOKIE)?.value);
}
