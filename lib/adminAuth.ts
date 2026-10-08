import { cookies } from "next/headers";

const ADMIN_SESSION_COOKIE = "admin_session";

function expectedAdminToken(): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return null;
  return Buffer.from(secret).toString("base64");
}

/**
 * For Server Functions under /admin/** — defense in depth behind proxy.ts's admin_session
 * gate. Mirrors lib/previewAuth.ts's hasPreviewAccess() but checks the existing admin
 * cookie instead, since Content Manager lives under /admin and should be exactly as
 * protected as every other /admin/* route, no weaker and no separately-gated.
 */
export async function hasAdminAccess(): Promise<boolean> {
  const expected = expectedAdminToken();
  if (!expected) return false;
  const jar = await cookies();
  return jar.get(ADMIN_SESSION_COOKIE)?.value === expected;
}
