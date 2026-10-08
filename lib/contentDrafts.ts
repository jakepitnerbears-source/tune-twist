import path from "path";
import fs from "fs";
import { getContentsConfig, readRemoteFile, commitFile } from "./githubContent";

const DRAFTS_PATH = "data/content-drafts.json";

export interface DraftPatch {
  catalog: "daily" | "quiz";
  id: string;
  field: string;
  draftValue: string;
  editedAt: string;
}

export type SaveResult = { ok: true } | { ok: false; reason: string };

function localPath(relPath: string) {
  return path.join(process.cwd(), relPath);
}

/**
 * Drafts are read from GitHub when a content token is configured (the durable path), and
 * only fall back to the local checked-in file for read-only local dev convenience — this
 * fallback never writes, so it can't create the "looks saved but isn't" problem the
 * architecture doc calls out.
 */
export async function loadDrafts(): Promise<DraftPatch[]> {
  const config = getContentsConfig();
  if (config) {
    const remote = await readRemoteFile(DRAFTS_PATH, config);
    if (remote) return JSON.parse(remote.content) as DraftPatch[];
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(localPath(DRAFTS_PATH), "utf-8")) as DraftPatch[];
  } catch {
    return [];
  }
}

export async function saveDraft(patch: Omit<DraftPatch, "editedAt">): Promise<SaveResult> {
  const config = getContentsConfig();
  if (!config) {
    return {
      ok: false,
      reason:
        "CONTENT_GITHUB_TOKEN / CONTENT_GITHUB_BRANCH are not configured yet, so this edit cannot be committed anywhere durable. Nothing was saved.",
    };
  }
  const remote = await readRemoteFile(DRAFTS_PATH, config);
  const existing: DraftPatch[] = remote ? JSON.parse(remote.content) : [];
  const next = existing.filter((d) => !(d.catalog === patch.catalog && d.id === patch.id && d.field === patch.field));
  next.push({ ...patch, editedAt: new Date().toISOString() });
  await commitFile(
    DRAFTS_PATH,
    JSON.stringify(next, null, 2) + "\n",
    remote?.sha,
    `Draft: ${patch.catalog}/${patch.id}.${patch.field}`,
    config
  );
  return { ok: true };
}

export async function discardDraft(catalog: DraftPatch["catalog"], id: string, field: string): Promise<SaveResult> {
  const config = getContentsConfig();
  if (!config) {
    return { ok: false, reason: "CONTENT_GITHUB_TOKEN / CONTENT_GITHUB_BRANCH are not configured yet." };
  }
  const remote = await readRemoteFile(DRAFTS_PATH, config);
  if (!remote) return { ok: true };
  const existing: DraftPatch[] = JSON.parse(remote.content);
  const next = existing.filter((d) => !(d.catalog === catalog && d.id === id && d.field === field));
  await commitFile(DRAFTS_PATH, JSON.stringify(next, null, 2) + "\n", remote.sha, `Discard draft: ${catalog}/${id}.${field}`, config);
  return { ok: true };
}

const CATALOG_PATH: Record<DraftPatch["catalog"], string> = {
  daily: "data/songs.json",
  quiz: "data/quizzes/catalog.json",
};

/** Applies a pending patch to the real catalog file, then removes the draft. Two commits. */
export async function publishDraft(catalog: DraftPatch["catalog"], id: string, field: string): Promise<SaveResult> {
  const config = getContentsConfig();
  if (!config) {
    return { ok: false, reason: "CONTENT_GITHUB_TOKEN / CONTENT_GITHUB_BRANCH are not configured yet." };
  }
  const draftsRemote = await readRemoteFile(DRAFTS_PATH, config);
  const drafts: DraftPatch[] = draftsRemote ? JSON.parse(draftsRemote.content) : [];
  const draft = drafts.find((d) => d.catalog === catalog && d.id === id && d.field === field);
  if (!draft) return { ok: false, reason: "No pending draft found for that field." };

  const filePath = CATALOG_PATH[catalog];
  const catalogRemote = await readRemoteFile(filePath, config);
  if (!catalogRemote) return { ok: false, reason: `Could not read ${filePath} from GitHub.` };
  const records: Array<Record<string, unknown>> = JSON.parse(catalogRemote.content);
  const record = records.find((r) => r.id === id);
  if (!record) return { ok: false, reason: `No record with id "${id}" in ${filePath}.` };
  record[field] = draft.draftValue;

  await commitFile(
    filePath,
    JSON.stringify(records, null, 2) + "\n",
    catalogRemote.sha,
    `Publish: ${catalog}/${id}.${field} = "${draft.draftValue}"`,
    config
  );

  const remainingDrafts = drafts.filter((d) => !(d.catalog === catalog && d.id === id && d.field === field));
  await commitFile(
    DRAFTS_PATH,
    JSON.stringify(remainingDrafts, null, 2) + "\n",
    draftsRemote?.sha,
    `Clear published draft: ${catalog}/${id}.${field}`,
    config
  );

  return { ok: true };
}
