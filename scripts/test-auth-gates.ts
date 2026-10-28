import { signToken } from "../lib/sessionToken";
import { isValidAdminSession } from "../lib/adminAuth";
import { isValidPreviewToken } from "../lib/previewAuth";

let failures = 0;
function assert(condition: boolean, message: string) {
  if (!condition) {
    failures++;
    console.error("FAIL:", message);
  } else {
    console.log("ok  :", message);
  }
}

const now = Date.now() / 1000;

// --- Admin gate ---
{
  delete process.env.ADMIN_SESSION_SECRET;
  const someToken = signToken("any-secret", { role: "admin" }, 3600, now);
  assert(isValidAdminSession(someToken) === false, "admin gate fails closed when ADMIN_SESSION_SECRET is unset, even with a well-formed token");
  assert(isValidAdminSession(undefined) === false, "admin gate rejects an absent cookie");

  process.env.ADMIN_SESSION_SECRET = "admin-secret-for-test";
  const validAdminToken = signToken("admin-secret-for-test", { role: "admin" }, 3600, now);
  assert(isValidAdminSession(validAdminToken) === true, "admin gate accepts a token signed with the matching secret");

  const wrongSecretToken = signToken("wrong-secret", { role: "admin" }, 3600, now);
  assert(isValidAdminSession(wrongSecretToken) === false, "admin gate rejects a token signed with a different secret");

  const expiredToken = signToken("admin-secret-for-test", { role: "admin" }, 1, now - 100);
  assert(isValidAdminSession(expiredToken) === false, "admin gate rejects an expired token");

  delete process.env.ADMIN_SESSION_SECRET;
}

// --- Preview gate (independent secret/cookie — a preview token must not work as an admin token and vice versa) ---
{
  process.env.ADMIN_SESSION_SECRET = "admin-secret-for-test";
  process.env.QUIZ_PREVIEW_SESSION_SECRET = "preview-secret-for-test";

  const adminToken = signToken("admin-secret-for-test", { role: "admin" }, 3600, now);
  const previewToken = signToken("preview-secret-for-test", { role: "preview" }, 3600, now);

  assert(isValidPreviewToken(previewToken) === true, "preview gate accepts a token signed with the preview secret");
  assert(isValidPreviewToken(adminToken) === false, "an admin-signed token does NOT grant preview access (different secret)");
  assert(isValidAdminSession(previewToken) === false, "a preview-signed token does NOT grant admin access (different secret)");

  delete process.env.ADMIN_SESSION_SECRET;
  delete process.env.QUIZ_PREVIEW_SESSION_SECRET;
  assert(isValidPreviewToken(previewToken) === false, "preview gate fails closed when QUIZ_PREVIEW_SESSION_SECRET is unset");
}

console.log(`\n${failures === 0 ? "ALL PASSED" : `${failures} FAILURE(S)`}`);
if (failures > 0) process.exit(1);
