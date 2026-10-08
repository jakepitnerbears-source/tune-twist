/**
 * Server-only GitHub Contents API client. This is the durable storage layer described in
 * docs/content-manager-architecture.md — content stays in repo JSON files, and the Content
 * Manager commits changes through GitHub rather than writing to Vercel's ephemeral filesystem.
 *
 * Never import this from a Client Component. The token it reads is server-only.
 */

const REPO_OWNER = "jakepitnerbears-source";
const REPO_NAME = "tune-twist";
const API_BASE = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;

export interface ContentsConfig {
  token: string;
  branch: string;
}

export function getContentsConfig(): ContentsConfig | null {
  const token = process.env.CONTENT_GITHUB_TOKEN;
  const branch = process.env.CONTENT_GITHUB_BRANCH;
  if (!token || !branch) return null;
  return { token, branch };
}

export interface RemoteFile {
  content: string;
  sha: string;
}

async function githubFetch(path: string, config: ContentsConfig, init?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  return res;
}

export async function readRemoteFile(filePath: string, config: ContentsConfig): Promise<RemoteFile | null> {
  const res = await githubFetch(`/contents/${filePath}?ref=${encodeURIComponent(config.branch)}`, config);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub read failed for ${filePath}: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const content = Buffer.from(data.content, "base64").toString("utf-8");
  return { content, sha: data.sha };
}

export async function commitFile(
  filePath: string,
  newContent: string,
  previousSha: string | undefined,
  message: string,
  config: ContentsConfig
): Promise<{ commitSha: string }> {
  const res = await githubFetch(`/contents/${filePath}`, config, {
    method: "PUT",
    body: JSON.stringify({
      message,
      content: Buffer.from(newContent, "utf-8").toString("base64"),
      sha: previousSha,
      branch: config.branch,
    }),
  });
  if (!res.ok) throw new Error(`GitHub commit failed for ${filePath}: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return { commitSha: data.commit?.sha };
}

/** Rollback = fetch the file as it was in the commit before `badCommitSha`, then re-commit that content. */
export async function readFileAtCommit(filePath: string, commitSha: string, config: ContentsConfig): Promise<RemoteFile | null> {
  const res = await githubFetch(`/contents/${filePath}?ref=${commitSha}`, config);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub read-at-commit failed for ${filePath}: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const content = Buffer.from(data.content, "base64").toString("utf-8");
  return { content, sha: data.sha };
}

export async function listFileHistory(filePath: string, config: ContentsConfig, limit = 10) {
  const res = await githubFetch(`/commits?path=${encodeURIComponent(filePath)}&sha=${encodeURIComponent(config.branch)}&per_page=${limit}`, config);
  if (!res.ok) throw new Error(`GitHub history fetch failed for ${filePath}: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return (data as Array<{ sha: string; commit: { message: string; author: { date: string } } }>).map((c) => ({
    sha: c.sha,
    message: c.commit.message,
    date: c.commit.author.date,
  }));
}
