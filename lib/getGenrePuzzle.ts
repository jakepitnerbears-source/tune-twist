import path from "path";
import fs from "fs";
import { songs as fallbackSongs, Song } from "@/data/puzzles";

export interface GenreDef {
  slug: string;
  name: string;
  emoji: string;
  desc: string;
}

export const GENRES: GenreDef[] = [
  { slug: "hip-hop", name: "Hip-Hop & Rap", emoji: "🎤", desc: "From classic flows to modern trap" },
  { slug: "rock", name: "Rock & Alternative", emoji: "🎸", desc: "Grunge, indie, metal & more" },
  { slug: "pop", name: "Pop", emoji: "🎵", desc: "The biggest chart-toppers" },
  { slug: "rb-soul", name: "R&B & Soul", emoji: "🎷", desc: "Smooth grooves and soulful hits" },
  { slug: "electronic", name: "Electronic & Dance", emoji: "🎧", desc: "EDM, synth-pop & dance anthems" },
  { slug: "country", name: "Country", emoji: "🤠", desc: "Nashville classics and modern country" },
  { slug: "2000s-pop-punk", name: "2000s Pop Punk", emoji: "🔥", desc: "Linkin Park, Evanescence & the era" },
  { slug: "2010s-pop", name: "2010s Pop", emoji: "📱", desc: "The streaming generation's anthems" },
  { slug: "90s", name: "90s Hits", emoji: "📼", desc: "The decade that defined everything" },
  { slug: "2000s", name: "2000s Hits", emoji: "💿", desc: "Y2K bangers and early 2000s classics" },
  { slug: "80s", name: "80s Hits", emoji: "🕹️", desc: "Synth, power ballads, and big hair" },
  { slug: "oldies", name: "Oldies & Classics", emoji: "🎺", desc: "Pre-80s timeless hits" },
];

function loadSongLibrary(): Song[] {
  try {
    const jsonPath = path.join(process.cwd(), "data/songs.json");
    if (fs.existsSync(jsonPath)) {
      return JSON.parse(fs.readFileSync(jsonPath, "utf-8")) as Song[];
    }
  } catch {}
  return fallbackSongs;
}

// Genres that are niche enough to have their own category —
// songs matching these should NOT bleed into decade buckets
function isNicheGenre(genre: string): boolean {
  return /latin|reggae|reggaeton|jazz|classical|gospel|blues|folk|country|electronic|edm|dance|hip.hop|rap|trap|r&b|soul|funk/.test(genre);
}

function matchesGenre(song: Song, slug: string): boolean {
  const genre = song.hints[1].toLowerCase();
  const year = parseInt(song.releaseYear);

  switch (slug) {
    case "hip-hop":
      return /hip.hop|rap|trap/.test(genre);
    case "rock":
      return /rock|metal|grunge|punk/.test(genre);
    case "pop":
      return /^pop|pop[/\-\s]/.test(genre) && !/hip.hop|rap|rock|country/.test(genre);
    case "rb-soul":
      return /r&b|soul|funk/.test(genre) && !/hip.hop|rap/.test(genre);
    case "electronic":
      return /electronic|edm|dance/.test(genre);
    case "country":
      return /country/.test(genre);
    case "2000s-pop-punk":
      return year >= 2000 && year <= 2009 && /rock|punk|metal|alternative/.test(genre);
    case "2010s-pop":
      return year >= 2010 && year <= 2019 && /^pop|pop[/\-\s]/.test(genre) && !/hip.hop|rap|rock|country/.test(genre);
    case "90s":
      return year >= 1990 && year <= 1999 && !isNicheGenre(genre);
    case "2000s":
      return year >= 2000 && year <= 2009 && !isNicheGenre(genre);
    case "80s":
      return year >= 1980 && year <= 1989 && !isNicheGenre(genre);
    case "oldies":
      return year < 1980 && !isNicheGenre(genre);
    default:
      return false;
  }
}

function getDayIndex(): number {
  const epoch = new Date("2026-01-01").getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - epoch) / (1000 * 60 * 60 * 24));
}

export function getGenrePool(slug: string): Song[] {
  const library = loadSongLibrary();
  return library.filter((s) => matchesGenre(s, slug));
}

export function getGenrePuzzle(slug: string): Song[] {
  const pool = getGenrePool(slug);
  if (pool.length === 0) return [];
  if (pool.length <= 5) return pool;

  const dayIndex = getDayIndex();
  const slugOffset = [...slug].reduce((a, c) => a + c.charCodeAt(0), 0);

  const picked: Song[] = [];
  const used = new Set<string>();
  for (let i = 0; picked.length < 5 && i < pool.length; i++) {
    const song = pool[(dayIndex + slugOffset + i) % pool.length];
    if (!used.has(song.id)) {
      used.add(song.id);
      picked.push(song);
    }
  }
  return picked;
}
