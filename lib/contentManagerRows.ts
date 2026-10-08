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
  dailyStatus?: DailyScheduleStatus;
  quizId?: string;
  quizSynonymTitle?: string;
  quizPacks?: string[];
  pendingDaily?: { field: string; draftValue: string };
  pendingQuiz?: { field: string; draftValue: string };
}

export function buildContentRows(daily: Song[], quiz: QuizSong[], drafts: DraftPatch[]): ContentRow[] {
  const scheduleStatuses = getDailyScheduleStatuses();
  const rows = new Map<string, ContentRow>();

  for (const song of daily) {
    const identity = normalizeIdentity(song.title, song.artist);
    const draft = drafts.find((d) => d.catalog === "daily" && d.id === song.id && d.field === "synonymTitle");
    rows.set(identity, {
      identity,
      title: song.title,
      artist: song.artist,
      inDaily: true,
      inQuiz: false,
      dailyId: song.id,
      dailySynonymTitle: song.synonymTitle,
      dailyStatus: scheduleStatuses.get(song.id)?.status ?? "unscheduled",
      pendingDaily: draft ? { field: draft.field, draftValue: draft.draftValue } : undefined,
    });
  }

  for (const song of quiz) {
    const identity = normalizeIdentity(song.title, song.artist);
    const draft = drafts.find((d) => d.catalog === "quiz" && d.id === song.id && d.field === "synonymTitle");
    const existing = rows.get(identity);
    if (existing) {
      existing.inQuiz = true;
      existing.quizId = song.id;
      existing.quizSynonymTitle = song.synonymTitle;
      existing.quizPacks = song.quizzes;
      existing.pendingQuiz = draft ? { field: draft.field, draftValue: draft.draftValue } : undefined;
    } else {
      rows.set(identity, {
        identity,
        title: song.title,
        artist: song.artist,
        inDaily: false,
        inQuiz: true,
        quizId: song.id,
        quizSynonymTitle: song.synonymTitle,
        quizPacks: song.quizzes,
        pendingQuiz: draft ? { field: draft.field, draftValue: draft.draftValue } : undefined,
      });
    }
  }

  return Array.from(rows.values()).sort((a, b) => a.title.localeCompare(b.title));
}
