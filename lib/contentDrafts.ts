import path from "path";
import fs from "fs";
import { getContentsConfig, readRemoteFile, commitFile, GithubConflictError, listFileHistory, readFileAtCommit } from "./githubContent";
import { loadQuizPacks } from "./quiz/catalog";
import { mergeRecord, validateDailyPublish, validateQuizPublish } from "./quiz/publishValidation";
import type { Song } from "@/data/puzzles";
import type { QuizSong } from "./quiz/types";

const DRAFTS_PATH = "data/content-drafts.json";

export type Catalog = "daily" | "quiz";

export interface DraftPatch {
  catalog: Catalog;
  id: string;
  /** True if this id doesn't exist in the published catalog yet (a new quiz song). */
  isNew: boolean;
  draftRecord: Record<string, unknown>;
  editedAt: string;
}

export type SaveResult = { ok: true } | { ok: false; reason: string };

const CATALOG_PATH: Record<Catalog, string> = {
  daily: "data/songs.json",
  quiz: "data/quizzes/catalog.json",
};

function localPath(relPath: string) {
  return path.join(process.cwd(), relPath);
}

function conflictMessage(e: unknown): string | null {
  return e instanceof GithubConflictError ? `${e.message} Reload the page and reapply your edit.` : null;
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

export async function saveDraft(input: { catalog: Catalog; id: string; isNew: boolean; draftRecord: Record<string, unknown> }): Promise<SaveResult> {
  const config = getContentsConfig();
  if (!config) {
    return {
      ok: false,
      reason: "CONTENT_GITHUB_TOKEN / CONTENT_GITHUB_BRANCH are not configured yet, so this edit cannot be committed anywhere durable. Nothing was saved.",
    };
  }
  try {
    const remote = await readRemoteFile(DRAFTS_PATH, config);
    const existing: DraftPatch[] = remote ? JSON.parse(remote.content) : [];
    const next = existing.filter((d) => !(d.catalog === input.catalog && d.id === input.id));
    next.push({ ...input, editedAt: new Date().toISOString() });
    await commitFile(DRAFTS_PATH, JSON.stringify(next, null, 2) + "\n", remote?.sha, `Draft: ${input.catalog}/${input.id}`, config);
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: conflictMessage(e) ?? `Unexpected error saving draft: ${(e as Error).message}` };
  }
}

export async function discardDraft(catalog: Catalog, id: string): Promise<SaveResult> {
  const config = getContentsConfig();
  if (!config) {
    return { ok: false, reason: "CONTENT_GITHUB_TOKEN / CONTENT_GITHUB_BRANCH are not configured yet." };
  }
  try {
    const remote = await readRemoteFile(DRAFTS_PATH, config);
    if (!remote) return { ok: true };
    const existing: DraftPatch[] = JSON.parse(remote.content);
    const next = existing.filter((d) => !(d.catalog === catalog && d.id === id));
    await commitFile(DRAFTS_PATH, JSON.stringify(next, null, 2) + "\n", remote.sha, `Discard draft: ${catalog}/${id}`, config);
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: conflictMessage(e) ?? `Unexpected error discarding draft: ${(e as Error).message}` };
  }
}

/** Applies a pending patch to the real catalog file (validating first), then removes the
 * draft. Two commits — if the first (catalog) succeeds but the second (clearing the draft)
 * fails, the content is live but the draft entry lingers; see docs/content-manager-architecture.md. */
export async function publishDraft(catalog: Catalog, id: string): Promise<SaveResult> {
  const config = getContentsConfig();
  if (!config) {
    return { ok: false, reason: "CONTENT_GITHUB_TOKEN / CONTENT_GITHUB_BRANCH are not configured yet." };
  }
  try {
    const draftsRemote = await readRemoteFile(DRAFTS_PATH, config);
    const drafts: DraftPatch[] = draftsRemote ? JSON.parse(draftsRemote.content) : [];
    const draft = drafts.find((d) => d.catalog === catalog && d.id === id);
    if (!draft) return { ok: false, reason: "No pending draft found for that song." };

    const filePath = CATALOG_PATH[catalog];
    const catalogRemote = await readRemoteFile(filePath, config);
    if (!catalogRemote) return { ok: false, reason: `Could not read ${filePath} from GitHub.` };
    const records: Array<Record<string, unknown>> = JSON.parse(catalogRemote.content);
    const existingIndex = records.findIndex((r) => r.id === id);

    if (draft.isNew) {
      if (existingIndex !== -1) return { ok: false, reason: `A song with id "${id}" already exists — can't publish as new.` };
    } else if (existingIndex === -1) {
      return { ok: false, reason: `No existing record with id "${id}" in ${filePath}.` };
    }

    const merged = mergeRecord(draft.isNew ? undefined : records[existingIndex], draft.draftRecord);

    if (catalog === "daily") {
      const check = validateDailyPublish(merged as Partial<Song>);
      if (!check.ok) return check;
      records[existingIndex] = merged;
    } else {
      const packs = loadQuizPacks();
      const dailyRemote = await readRemoteFile(CATALOG_PATH.daily, config);
      const daily: Song[] = dailyRemote ? JSON.parse(dailyRemote.content) : [];
      const candidateCatalog = draft.isNew ? [...records, merged] : records.map((r, i) => (i === existingIndex ? merged : r));
      const check = validateQuizPublish(candidateCatalog as unknown as QuizSong[], daily, packs);
      if (!check.ok) return check;
      if (draft.isNew) records.push(merged);
      else records[existingIndex] = merged;
    }

    await commitFile(
      filePath,
      JSON.stringify(records, null, 2) + "\n",
      catalogRemote.sha,
      `Publish: ${catalog}/${id}${draft.isNew ? " (new)" : ""}`,
      config
    );

    const remainingDrafts = drafts.filter((d) => !(d.catalog === catalog && d.id === id));
    await commitFile(DRAFTS_PATH, JSON.stringify(remainingDrafts, null, 2) + "\n", draftsRemote?.sha, `Clear published draft: ${catalog}/${id}`, config);

    return { ok: true };
  } catch (e) {
    return { ok: false, reason: conflictMessage(e) ?? `Unexpected error publishing: ${(e as Error).message}` };
  }
}

export interface HistoryEntry {
  sha: string;
  message: string;
  date: string;
}

export type HistoryResult = { ok: true; history: HistoryEntry[] } | { ok: false; reason: string };

export async function getCatalogHistory(catalog: Catalog): Promise<HistoryResult> {
  const config = getContentsConfig();
  if (!config) return { ok: false, reason: "CONTENT_GITHUB_TOKEN / CONTENT_GITHUB_BRANCH are not configured yet." };
  try {
    const history = await listFileHistory(CATALOG_PATH[catalog], config, 10);
    return { ok: true, history };
  } catch (e) {
    return { ok: false, reason: `Unexpected error reading history: ${(e as Error).message}` };
  }
}

/** Rollback = re-commit the file exactly as it was at `commitSha`, as a new commit (git-native
 * history keeps both versions — nothing is deleted). */
export async function rollbackCatalog(catalog: Catalog, commitSha: string): Promise<SaveResult> {
  const config = getContentsConfig();
  if (!config) return { ok: false, reason: "CONTENT_GITHUB_TOKEN / CONTENT_GITHUB_BRANCH are not configured yet." };
  try {
    const filePath = CATALOG_PATH[catalog];
    const atCommit = await readFileAtCommit(filePath, commitSha, config);
    if (!atCommit) return { ok: false, reason: `Could not read ${filePath} at commit ${commitSha}.` };
    const current = await readRemoteFile(filePath, config);
    await commitFile(filePath, atCommit.content, current?.sha, `Rollback: ${catalog} to ${commitSha.slice(0, 7)}`, config);
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: conflictMessage(e) ?? `Unexpected error rolling back: ${(e as Error).message}` };
  }
}
