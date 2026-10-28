import { getContentsConfig, commitFile, GithubConflictError, ContentsConfig } from "../lib/githubContent";

let failures = 0;
function assert(condition: boolean, message: string) {
  if (!condition) {
    failures++;
    console.error("FAIL:", message);
  } else {
    console.log("ok  :", message);
  }
}

async function main() {
  // 1. Missing env vars -> fails closed (null config), never throws, never invents a token.
  {
    delete process.env.CONTENT_GITHUB_TOKEN;
    delete process.env.CONTENT_GITHUB_BRANCH;
    assert(getContentsConfig() === null, "missing CONTENT_GITHUB_TOKEN/BRANCH yields null config (fail closed)");

    process.env.CONTENT_GITHUB_TOKEN = "fake-token";
    assert(getContentsConfig() === null, "token alone without branch still yields null config");
    delete process.env.CONTENT_GITHUB_TOKEN;
  }

  const config: ContentsConfig = { token: "fake-token", branch: "test-branch" };
  const realFetch = global.fetch;

  // 2. A 409 from GitHub (sha mismatch / concurrent edit) raises a distinguishable error.
  {
    global.fetch = (async () => new Response("conflict", { status: 409 })) as typeof fetch;
    try {
      await commitFile("data/songs.json", "{}", "stale-sha", "test commit", config);
      assert(false, "expected commitFile to throw on 409");
    } catch (e) {
      assert(e instanceof GithubConflictError, "409 response raises GithubConflictError, not a generic Error");
    }
  }

  // 3. A plain 500 raises a generic (non-conflict) error — callers can tell the difference.
  {
    global.fetch = (async () => new Response("server error", { status: 500 })) as typeof fetch;
    try {
      await commitFile("data/songs.json", "{}", "sha", "test commit", config);
      assert(false, "expected commitFile to throw on 500");
    } catch (e) {
      assert(!(e instanceof GithubConflictError), "a 500 is NOT classified as a conflict");
      assert(e instanceof Error, "a 500 still raises a plain Error");
    }
  }

  // 4. A successful commit returns the new commit sha.
  {
    global.fetch = (async () =>
      new Response(JSON.stringify({ commit: { sha: "abc123" } }), { status: 200 })) as typeof fetch;
    const result = await commitFile("data/songs.json", "{}", "sha", "test commit", config);
    assert(result.commitSha === "abc123", "a successful commit returns the new commit sha");
  }

  global.fetch = realFetch;

  console.log(`\n${failures === 0 ? "ALL PASSED" : `${failures} FAILURE(S)`}`);
  if (failures > 0) process.exit(1);
}

main();
