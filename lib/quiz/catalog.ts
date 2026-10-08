import path from "path";
import fs from "fs";
import { QuizSong, QuizPackConfig } from "./types";
import type { Song } from "@/data/puzzles";

function readJson<T>(relPath: string): T {
  const jsonPath = path.join(process.cwd(), relPath);
  return JSON.parse(fs.readFileSync(jsonPath, "utf-8")) as T;
}

export function loadQuizCatalog(): QuizSong[] {
  return readJson<QuizSong[]>("data/quizzes/catalog.json");
}

export function loadQuizPacks(): QuizPackConfig[] {
  return readJson<QuizPackConfig[]>("data/quizzes/packs.json");
}

export function loadDailyCatalog(): Song[] {
  try {
    return readJson<Song[]>("data/songs.json");
  } catch {
    return [];
  }
}

export function getQuizPack(slug: string): QuizPackConfig | undefined {
  return loadQuizPacks().find((p) => p.slug === slug);
}

/** Published songs assigned to a given pack slug. Never falls back to the daily catalog. */
export function getQuizPackSongs(slug: string): QuizSong[] {
  return loadQuizCatalog().filter(
    (s) => s.reviewStatus === "published" && !s.archived && s.quizzes.includes(slug)
  );
}

export function normalizeIdentity(title: string, artist: string): string {
  return `${title}::${artist}`
    .toLowerCase()
    .replace(/[^a-z0-9:]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
