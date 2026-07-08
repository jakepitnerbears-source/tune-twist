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

const LEAD_GENRE_ROTATION = ["Pop", "Rock", "Hip-Hop", "R&B", "Country", "Alternative", "Electronic", "Pop", "Hip Hop", "Indie", "Country", "Latin", "Pop", "Funk"];

function rotateLead(songs: Song[], dayIndex: number): Song[] {
  const targetGenre = LEAD_GENRE_ROTATION[Math.abs(dayIndex) % LEAD_GENRE_ROTATION.length];
  const idx = songs.findIndex((s) => (s.genre ?? "") === targetGenre);
  if (idx < 0) return songs;
  const result = [...songs];
  [result[0], result[idx]] = [result[idx], result[0]];
  return result;
}

const NON_POP_GENRES = new Set(["Rock", "Hip-Hop", "Hip Hop", "R&B", "Country", "Pop-Punk", "Alternative", "Indie", "Electronic", "Funk/Disco", "Metal", "Latin", "Funk"]);

function primaryArtist(artist: string): string {
  return artist.split(/,|&/)[0].trim().toLowerCase();
}

function buildDiverseSchedule(songSlots: Song[], seed: number): Song[][] {
  const shuffled = seededShuffle(songSlots, seed);
  const remaining = [...shuffled];
  const days: Song[][] = [];

  for (let d = 0; d < CYCLE_LENGTH; d++) {
    const day: Song[] = [];
    const usedArtists = new Set<string>();
    const genreCounts: Record<string, number> = {};
    let hasNonPop = false;

    let i = 0;
    while (day.length < 5 && i < remaining.length) {
      const song = remaining[i];
      const genre = song.genre ?? "Other";
      const artist = primaryArtist(song.artist);
      const isNonPop = genre !== "Pop";
      const genreOk = (genreCounts[genre] ?? 0) < 2;
      const artistOk = !usedArtists.has(artist);
      const nonPopOk = day.length < 4 || hasNonPop || isNonPop;

      if (genreOk && artistOk && nonPopOk) {
        day.push(song);
        usedArtists.add(artist);
        genreCounts[genre] = (genreCounts[genre] ?? 0) + 1;
        if (isNonPop) hasNonPop = true;
        remaining.splice(i, 1);
      } else {
        i++;
      }
    }

    // Fallback: fill remaining slots ignoring rules if necessary
    while (day.length < 5 && remaining.length > 0) {
      day.push(remaining.shift()!);
    }

    days.push(day);
  }

  return days;
}

export function getPuzzleNumber(dateOverride?: string): number {
  return getDaysFromEpoch(dateOverride) + 1;
}

export function loadScheduleAndLibrary() {
  return { schedule: loadSchedule(), library: loadSongLibrary() };
}

export function loadLyrics(): Record<string, string> {
  try {
    const jsonPath = path.join(process.cwd(), "data/lyrics.json");
    if (fs.existsSync(jsonPath)) {
      return JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    }
  } catch {}
  return {};
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
    const songSlots = flatIds.map((id) => songMap[id]).filter(Boolean) as Song[];

    if (cycleNum === 0) {
      const daySlot = songSlots.slice(dayIndex * 5, dayIndex * 5 + 5);
      if (daySlot.length === 5) return rotateLead(seededShuffle(daySlot, days * 31 + 7), days);
    } else {
      const scheduleDays = buildDiverseSchedule(songSlots, cycleNum);
      if (scheduleDays[dayIndex]?.length === 5) return rotateLead(seededShuffle(scheduleDays[dayIndex], days * 31 + 7), days);
    }
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
