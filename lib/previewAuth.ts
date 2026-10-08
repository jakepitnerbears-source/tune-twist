import { cookies } from "next/headers";

export const PREVIEW_COOKIE = "quiz_preview_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days — short-lived on purpose, this gate sits in front of unpublished content

export function expectedPreviewToken(): string | null {
  const secret = process.env.QUIZ_PREVIEW_SESSION_SECRET;
  if (!secret) return null;
  return Buffer.from(secret).toString("base64");
}

export function isValidPreviewToken(value: string | undefined | null): boolean {
  const expected = expectedPreviewToken();
  if (!expected) return false;
  return value === expected;
}

/** For Server Components / Route Handlers — defense in depth behind proxy.ts's gate. */
export async function hasPreviewAccess(): Promise<boolean> {
  const jar = await cookies();
  return isValidPreviewToken(jar.get(PREVIEW_COOKIE)?.value);
}

export { COOKIE_MAX_AGE as PREVIEW_COOKIE_MAX_AGE };
