import path from "path";
import fs from "fs";
import { songs as fallbackSongs, Song } from "@/data/puzzles";

export type DailyPuzzle = Song[];

type Schedule = string[][];

const CYCLE_LENGTH = 120;
const EPOCH = new Date("2026-04-13T12:00:00").getTime();

function getDaysFromEpoch(date?: string): number {
  const d = date ? new Date(date + "T12:00:00") : new Date();
  if (!date) d.setHours(12, 0, 0, 0);
  return Math.floor((d.getTime() - EPOCH) / 86_400_000);
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  let s = (seed + 1) >>> 0;
  for (let i = result.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const NON_POP_GENRES = new Set(["Rock", "Hip-Hop", "Hip Hop", "R&B", "Country", "Pop-Punk", "Alternative", "Indie", "Electronic", "Funk/Disco", "Metal", "Latin", "Funk"]);

function primaryArtist(artist: string): string {
  return artist.split(/,|&/)[0].trim().toLowerCase();
}

export function getPuzzleNumber(dateOverride?: string): number {
  return getDaysFromEpoch(dateOverride) + 1;
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
  return [];
}

export function getDailyPuzzle(dateOverride?: string): DailyPuzzle {
  const days = getDaysFromEpoch(dateOverride);
  const dayIndex = ((days % CYCLE_LENGTH) + CYCLE_LENGTH) % CYCLE_LENGTH;
  const cycleNum = Math.floor(days / CYCLE_LENGTH);

  const library = loadSongLibrary();
  const schedule = loadSchedule();
  const songMap = Object.fromEntries(library.map((s) => [s.id, s]));

  if (schedule.length > 0) {
    const flatIds = schedule.flat();
    const orderedIds = cycleNum === 0 ? flatIds : seededShuffle(flatIds, cycleNum);
    const daySlot = orderedIds.slice(dayIndex * 5, dayIndex * 5 + 5);
    const songs = daySlot.map((id) => songMap[id]).filter(Boolean) as Song[];
    if (songs.length === 5) return songs;
  }

  // Fallback: genre-based rotation — 3 Pop + 2 from other genres
  const dayIdx = Math.max(0, days);
  const usedIds: string[] = [];
  const usedArtists: string[] = [];
  const usedGenres: string[] = [];

  function pickFrom(pool: Song[], offset = 0): Song {
    const filtered = pool.filter(
      (s) => !usedIds.includes(s.id) && !usedArtists.includes(primaryArtist(s.artist))
    );
    const source = filtered.length > 0 ? filtered : pool.filter((s) => !usedIds.includes(s.id));
    const fallback = source.length > 0 ? source : pool;
    return fallback[(dayIdx + offset) % fallback.length];
  }

  const popPool = library.filter((s) => s.genre === "Pop");
  const nonPopPool = library.filter((s) => NON_POP_GENRES.has(s.genre ?? ""));
  const results: Song[] = [];

  for (let i = 0; i < 3; i++) {
    const song = pickFrom(popPool, i);
    results.push(song);
    usedIds.push(song.id);
    usedArtists.push(primaryArtist(song.artist));
  }

  for (let i = 0; i < 2; i++) {
    const preferNew = nonPopPool.filter((s) => !usedGenres.includes(s.genre ?? ""));
    const pool = preferNew.length > 0 ? preferNew : nonPopPool;
    const song = pickFrom(pool, i + 10);
    results.push(song);
    usedIds.push(song.id);
    usedArtists.push(primaryArtist(song.artist));
    usedGenres.push(song.genre ?? "");
  }

  return results;
}
