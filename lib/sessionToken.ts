import crypto from "crypto";

/**
 * Signed, expiring session tokens (HMAC-SHA256) — replaces the earlier approach of using a
 * static base64(secret) as the cookie value everywhere in this codebase. A static token
 * never expires on its own, can't be scoped to a single login, and is bit-for-bit identical
 * every time, which makes it a de facto second permanent password rather than a session.
 *
 * Token shape: base64url(JSON payload with iat/exp) + "." + HMAC signature of that payload,
 * so tampering with the payload (e.g. extending `exp`) invalidates the signature.
 */

export interface TokenPayload {
  [key: string]: unknown;
  iat: number;
  exp: number;
}

function sign(secret: string, encodedPayload: string): string {
  return crypto.createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function signToken(secret: string, payload: Record<string, unknown>, maxAgeSeconds: number, now: number): string {
  const body: TokenPayload = { ...payload, iat: now, exp: now + maxAgeSeconds };
  const encoded = Buffer.from(JSON.stringify(body)).toString("base64url");
  return `${encoded}.${sign(secret, encoded)}`;
}

export function verifyToken(secret: string, token: string | undefined | null, now: number): TokenPayload | null {
  if (!token) return null;
  const dotIndex = token.lastIndexOf(".");
  if (dotIndex <= 0) return null;
  const encoded = token.slice(0, dotIndex);
  const signature = token.slice(dotIndex + 1);
  const expectedSignature = sign(secret, encoded);
  if (!timingSafeEqualStr(signature, expectedSignature)) return null;

  let payload: TokenPayload;
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf-8"));
  } catch {
    return null;
  }
  if (typeof payload.exp !== "number" || payload.exp < now) return null;
  return payload;
}
