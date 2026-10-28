import { signToken, verifyToken } from "../lib/sessionToken";

let failures = 0;
function assert(condition: boolean, message: string) {
  if (!condition) {
    failures++;
    console.error("FAIL:", message);
  } else {
    console.log("ok  :", message);
  }
}

const SECRET = "test-secret";
const NOW = 1_700_000_000;

// 1. Round trip — valid token verifies and returns payload.
{
  const token = signToken(SECRET, { role: "admin" }, 3600, NOW);
  const payload = verifyToken(SECRET, token, NOW + 10);
  assert(payload !== null, "valid token verifies");
  assert(payload?.role === "admin", "payload round-trips custom fields");
}

// 2. Expired token is rejected.
{
  const token = signToken(SECRET, { role: "admin" }, 10, NOW);
  const payload = verifyToken(SECRET, token, NOW + 11);
  assert(payload === null, "expired token is rejected");
}

// 3. Token right at the expiry boundary (not yet expired) still verifies.
{
  const token = signToken(SECRET, { role: "admin" }, 10, NOW);
  const payload = verifyToken(SECRET, token, NOW + 10);
  assert(payload !== null, "token at exact expiry boundary still verifies");
}

// 4. Tampered payload (bit flip) is rejected — signature won't match.
{
  const token = signToken(SECRET, { role: "admin" }, 3600, NOW);
  const [encoded, sig] = token.split(".");
  const tamperedEncoded = Buffer.from(JSON.stringify({ role: "superadmin", iat: NOW, exp: NOW + 3600 })).toString("base64url");
  const tampered = `${tamperedEncoded}.${sig}`;
  assert(verifyToken(SECRET, tampered, NOW + 1) === null, "tampered payload is rejected");
  assert(encoded.length > 0, "sanity: original token has a payload segment");
}

// 5. Wrong secret is rejected.
{
  const token = signToken(SECRET, { role: "admin" }, 3600, NOW);
  assert(verifyToken("wrong-secret", token, NOW + 1) === null, "wrong secret is rejected");
}

// 6. Garbage / malformed token is rejected without throwing.
{
  assert(verifyToken(SECRET, "not-a-real-token", NOW) === null, "malformed token is rejected");
  assert(verifyToken(SECRET, "", NOW) === null, "empty string token is rejected");
  assert(verifyToken(SECRET, undefined, NOW) === null, "undefined token is rejected");
  assert(verifyToken(SECRET, ".", NOW) === null, "bare separator token is rejected");
}

// 7. Two tokens signed at the same instant with the same payload are identical (deterministic),
// but tokens signed a second apart differ (iat changes) — confirms iat/exp are actually used,
// not a static blob like the previous implementation.
{
  const tokenA = signToken(SECRET, { role: "admin" }, 3600, NOW);
  const tokenB = signToken(SECRET, { role: "admin" }, 3600, NOW + 1);
  assert(tokenA !== tokenB, "tokens signed at different times differ (not a static value)");
}

console.log(`\n${failures === 0 ? "ALL PASSED" : `${failures} FAILURE(S)`}`);
if (failures > 0) process.exit(1);
