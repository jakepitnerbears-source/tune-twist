import path from "path";
import fs from "fs";
import { songs as fallbackSongs, Song, Difficulty } from "@/data/puzzles";

export type DailyPuzzle = Song[];

type Schedule = Record<string, [string, string, string, string, string]>;

function getDayIndex(): number {
  const epoch = new Date("2026-01-01").getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - epoch) / (1000 * 60 * 60 * 24));
}

function rotatePick(pool: Song[], dayIndex: number): Song {
  return pool[dayIndex % pool.length];
}

export function getPuzzleNumber(dateOverride?: string): number {
  if (dateOverride) {
    const epoch = new Date("2026-01-01").getTime();
    const d = new Date(dateOverride);
    d.setHours(0, 0, 0, 0);
    return Math.floor((d.getTime() - epoch) / (1000 * 60 * 60 * 24)) + 1;
  }
  return getDayIndex() + 1;
}

export function loadScheduleAndLibrary() {
  return { schedule: loadSchedule(), library: loadSongLibrary() };
}

function loadSongLibrary(): Song[] {
  try {
    const jsonPath = path.join(process.cwd(), "data/songs.json");
    if (fs.existsSync(jsonPath)) {
      return JSON.parse(fs.readFileSync(jsonPath, "utf-8")) as Song[];
    }
  } catch {}
  return fallbackSongs;
}

function loadSchedule(): Schedule {
  try {
    const jsonPath = path.join(process.cwd(), "data/schedule.json");
    if (fs.existsSync(jsonPath)) {
      return JSON.parse(fs.readFileSync(jsonPath, "utf-8")) as Schedule;
    }
  } catch {}
  return {};
}

export function getDailyPuzzle(dateOverride?: string): DailyPuzzle {
  const todayKey = dateOverride ?? new Date().toISOString().split("T")[0];
  const library = loadSongLibrary();
  const schedule = loadSchedule();
  const songMap = Object.fromEntries(library.map((s) => [s.id, s]));

  // Use schedule.json if today has an entry
  if (schedule[todayKey]) {
    const ids = schedule[todayKey];
    const scheduled = ids.map((id) => songMap[id]).filter(Boolean) as Song[];
    if (scheduled.length === 5) return scheduled;
  }

  // Fallback: rotate from library by difficulty
  const dayIndex = getDayIndex();
  const used: string[] = [];

  const easyPool = library.filter((s) => s.difficulty === "easy");
  const easy = rotatePick(easyPool, dayIndex);
  used.push(easy.id);

  const mediumPool = library.filter((s) => s.difficulty === "medium" && !used.includes(s.id));
  const medium1 = rotatePick(mediumPool, dayIndex);
  used.push(medium1.id);

  const medium2Pool = mediumPool.filter((s) => !used.includes(s.id));
  const medium2 = rotatePick(medium2Pool, dayIndex + 1);
  used.push(medium2.id);

  const hardPool = library.filter((s) => s.difficulty === "hard" && !used.includes(s.id));
  const hard = rotatePick(hardPool, dayIndex);
  used.push(hard.id);

  const viralPool = library.filter((s) => s.difficulty === "viral" && !used.includes(s.id));
  const viral = rotatePick(viralPool, dayIndex);

  return [easy, medium1, medium2, hard, viral];
}
