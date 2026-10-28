import type { Song } from "@/data/puzzles";
import type { QuizSong } from "./quiz/types";
import { normalizeIdentity } from "./quiz/catalog";
import { getDailyScheduleStatuses, DailyScheduleStatus } from "./scheduleDate";
import type { DraftPatch } from "./contentDrafts";

export interface ContentRow {
  identity: string;
  title: string;
  artist: string;
  inDaily: boolean;
  inQuiz: boolean;
  dailyId?: string;
  dailySynonymTitle?: string;
  dailyHints?: [string, string];
  dailyStatus?: DailyScheduleStatus;
  quizId?: string;
  quizSynonymTitle?: string;
  quizHints?: [string, string];
  quizPacks?: string[];
  quizArchived?: boolean;
  pendingDaily?: DraftPatch;
  pendingQuiz?: DraftPatch;
}

export function buildContentRows(daily: Song[], quiz: QuizSong[], drafts: DraftPatch[]): ContentRow[] {
  const scheduleStatuses = getDailyScheduleStatuses();
  const rows = new Map<string, ContentRow>();

  for (const song of daily) {
    const identity = normalizeIdentity(song.title, song.artist);
    const draft = drafts.find((d) => d.catalog === "daily" && d.id === song.id && !d.isNew);
    rows.set(identity, {
      identity,
      title: song.title,
      artist: song.artist,
      inDaily: true,
      inQuiz: false,
      dailyId: song.id,
      dailySynonymTitle: song.synonymTitle,
      dailyHints: song.hints,
      dailyStatus: scheduleStatuses.get(song.id)?.status ?? "unscheduled",
      pendingDaily: draft,
    });
  }

  for (const song of quiz) {
    const identity = normalizeIdentity(song.title, song.artist);
    const draft = drafts.find((d) => d.catalog === "quiz" && d.id === song.id && !d.isNew);
    const existing = rows.get(identity);
    if (existing) {
      existing.inQuiz = true;
      existing.quizId = song.id;
      existing.quizSynonymTitle = song.synonymTitle;
      existing.quizHints = song.hints;
      existing.quizPacks = song.quizzes;
      existing.quizArchived = song.archived;
      existing.pendingQuiz = draft;
    } else {
      rows.set(identity, {
        identity,
        title: song.title,
        artist: song.artist,
        inDaily: false,
        inQuiz: true,
        quizId: song.id,
        quizSynonymTitle: song.synonymTitle,
        quizHints: song.hints,
        quizPacks: song.quizzes,
        quizArchived: song.archived,
        pendingQuiz: draft,
      });
    }
  }

  // New, not-yet-published quiz songs exist only as drafts — surface them as virtual rows
  // so they're visible/editable before the first publish.
  for (const draft of drafts.filter((d) => d.catalog === "quiz" && d.isNew)) {
    const title = (draft.draftRecord.title as string) || "(untitled draft)";
    const artist = (draft.draftRecord.artist as string) || "(unknown artist)";
    const identity = `draft::${draft.id}`;
    rows.set(identity, {
      identity,
      title,
      artist,
      inDaily: false,
      inQuiz: true,
      quizId: draft.id,
      quizSynonymTitle: (draft.draftRecord.synonymTitle as string) ?? "",
      quizHints: (draft.draftRecord.hints as [string, string]) ?? ["", ""],
      quizPacks: (draft.draftRecord.quizzes as string[]) ?? [],
      quizArchived: false,
      pendingQuiz: draft,
    });
  }

  return Array.from(rows.values()).sort((a, b) => a.title.localeCompare(b.title));
}
