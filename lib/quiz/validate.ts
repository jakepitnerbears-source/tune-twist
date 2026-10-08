import { QuizSong, QuizPackConfig } from "./types";
import type { Song } from "@/data/puzzles";
import { normalizeIdentity } from "./catalog";

export interface ValidationIssue {
  code: string;
  message: string;
  songId?: string;
}

export interface ValidationReport {
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  info: ValidationIssue[];
}

const REQUIRED_FIELDS: (keyof QuizSong)[] = [
  "id",
  "title",
  "artist",
  "releaseYear",
  "synonymTitle",
  "hints",
  "quizzes",
  "reviewStatus",
];

export function validateQuizCatalog(
  quizCatalog: QuizSong[],
  dailyCatalog: Song[],
  packs: QuizPackConfig[]
): ValidationReport {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const info: ValidationIssue[] = [];

  // 1. Missing/malformed required fields.
  for (const song of quizCatalog) {
    for (const field of REQUIRED_FIELDS) {
      const value = song[field];
      if (value === undefined || value === null || value === "") {
        errors.push({
          code: "missing-field",
          message: `Song "${song.id ?? "(no id)"}" is missing required field "${field}".`,
          songId: song.id,
        });
      }
    }
    if (song.hints && song.hints.length !== 2) {
      errors.push({
        code: "invalid-hints",
        message: `Song "${song.id}" must have exactly 2 hints, has ${song.hints.length}.`,
        songId: song.id,
      });
    }
    if (song.quizzes && song.quizzes.length === 0) {
      errors.push({
        code: "unassigned-song",
        message: `Song "${song.id}" is not assigned to any quiz pack.`,
        songId: song.id,
      });
    }
  }

  // 2. Duplicate / invalid IDs within the quiz catalog.
  const idCounts = new Map<string, number>();
  for (const song of quizCatalog) {
    if (!song.id) continue;
    idCounts.set(song.id, (idCounts.get(song.id) ?? 0) + 1);
  }
  for (const [id, count] of idCounts) {
    if (count > 1) {
      errors.push({ code: "duplicate-id", message: `Song id "${id}" appears ${count} times in the quiz catalog.`, songId: id });
    }
  }

  // 3. Duplicate identities (same normalized title+artist) within the quiz catalog —
  // almost always a mistake (the same song entered twice under different ids).
  const identityToIds = new Map<string, string[]>();
  for (const song of quizCatalog) {
    if (!song.title || !song.artist) continue;
    const key = normalizeIdentity(song.title, song.artist);
    identityToIds.set(key, [...(identityToIds.get(key) ?? []), song.id]);
  }
  for (const [key, ids] of identityToIds) {
    if (ids.length > 1) {
      errors.push({
        code: "duplicate-identity-in-quiz-catalog",
        message: `"${key}" appears ${ids.length} times in the quiz catalog (ids: ${ids.join(", ")}).`,
      });
    }
  }

  // 4. Overlap with the daily catalog — allowed, but reported, never blocked.
  const dailyIdentities = new Set(
    dailyCatalog.filter((s) => s.title && s.artist).map((s) => normalizeIdentity(s.title, s.artist))
  );
  for (const song of quizCatalog) {
    if (!song.title || !song.artist) continue;
    const key = normalizeIdentity(song.title, song.artist);
    if (dailyIdentities.has(key)) {
      info.push({
        code: "daily-quiz-overlap",
        message: `"${song.title}" — ${song.artist} exists in both the daily catalog and the quiz catalog (song "${song.id}"). Overlap is allowed; flagging for visibility.`,
        songId: song.id,
      });
    }
  }

  // 5. Repeated synonym twists — two different real songs disguised identically
  // would make a round genuinely ambiguous to solve.
  const twistToIds = new Map<string, string[]>();
  for (const song of quizCatalog) {
    if (!song.synonymTitle) continue;
    const key = song.synonymTitle.trim().toLowerCase();
    twistToIds.set(key, [...(twistToIds.get(key) ?? []), song.id]);
  }
  for (const [twist, ids] of twistToIds) {
    if (ids.length > 1) {
      warnings.push({
        code: "repeated-twist",
        message: `Synonym title "${twist}" is reused by ${ids.length} songs (ids: ${ids.join(", ")}) — a guesser can't tell them apart.`,
      });
    }
  }

  // 6. Pack pool health + cross-pack (artist vs. decade) overlap reporting.
  for (const pack of packs) {
    const published = quizCatalog.filter((s) => s.reviewStatus === "published" && s.quizzes.includes(pack.slug));
    if (published.length === 0) {
      warnings.push({ code: "empty-pack", message: `Pack "${pack.slug}" has 0 published songs — it will not render on the hub.` });
    } else if (published.length < 5) {
      info.push({ code: "thin-pack", message: `Pack "${pack.slug}" has only ${published.length} published songs (fewer than one 5-song round).` });
    }
  }
  const multiAssigned = quizCatalog.filter((s) => s.quizzes.length > 1);
  for (const song of multiAssigned) {
    info.push({
      code: "cross-pack-assignment",
      message: `Song "${song.id}" is assigned to multiple packs: ${song.quizzes.join(", ")}.`,
      songId: song.id,
    });
  }

  return { errors, warnings, info };
}
