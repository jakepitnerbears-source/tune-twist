import type { Song } from "@/data/puzzles";
import type { QuizSong, QuizPackConfig } from "./types";
import { validateQuizCatalog } from "./validate";

export type PublishCheck = { ok: true } | { ok: false; reason: string };

/** Shallow-merges a draft patch onto an existing record (or nothing, for a new record). */
export function mergeRecord<T extends Record<string, unknown>>(existing: T | undefined, draftRecord: Record<string, unknown>): T {
  return { ...(existing ?? {}), ...draftRecord } as T;
}

/** Minimal validation for daily songs — editing scope here is intentionally narrow
 * (synonym title + hints), so this doesn't need the full quiz-catalog validator. */
export function validateDailyPublish(record: Partial<Song>): PublishCheck {
  if (typeof record.synonymTitle !== "string" || record.synonymTitle.trim() === "") {
    return { ok: false, reason: "Synonym title can't be empty." };
  }
  if (record.hints !== undefined) {
    if (!Array.isArray(record.hints) || record.hints.length !== 2 || record.hints.some((h) => typeof h !== "string" || !h.trim())) {
      return { ok: false, reason: "Daily songs need exactly 2 non-empty hints." };
    }
  }
  return { ok: true };
}

/** Runs the candidate quiz catalog (existing catalog with one record added/replaced) through
 * the same validator used for the static-data checks, and blocks publish on any error. */
export function validateQuizPublish(
  candidateCatalog: QuizSong[],
  dailyCatalog: Song[],
  packs: QuizPackConfig[]
): PublishCheck {
  const report = validateQuizCatalog(candidateCatalog, dailyCatalog, packs);
  if (report.errors.length > 0) {
    return { ok: false, reason: `Publishing would introduce: ${report.errors.map((e) => e.message).join("; ")}` };
  }
  return { ok: true };
}
