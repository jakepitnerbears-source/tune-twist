import path from "path";
import fs from "fs";
import { Song } from "@/data/puzzles";

export interface Pack {
  slug: string;
  artistName: string;
  heading: string;
  title: string;
  description: string;
  intro: string;
}

export const PACKS: Pack[] = [
  {
    slug: "taylor-swift",
    artistName: "Taylor Swift",
    heading: "Guess the Taylor Swift Song",
    title: "Guess the Taylor Swift Song — Free Song Title Quiz | TuneTwist",
    description:
      "Can you guess the Taylor Swift song from its twisted title? A free Taylor Swift song quiz — titles rewritten with synonyms, no audio required.",
    intro:
      "Every title below is a real Taylor Swift song, rewritten using synonyms. No audio, no lyrics — just the title, in disguise. Decode 5 at a time, and hit play again for a fresh set.",
  },
];

export function getPack(slug: string): Pack | undefined {
  return PACKS.find((p) => p.slug === slug);
}

function loadSongLibrary(): Song[] {
  try {
    const jsonPath = path.join(process.cwd(), "data/songs.json");
    if (fs.existsSync(jsonPath)) {
      return JSON.parse(fs.readFileSync(jsonPath, "utf-8")) as Song[];
    }
  } catch {}
  return [];
}

export function getPackSongs(pack: Pack): Song[] {
  const library = loadSongLibrary();
  const target = pack.artistName.toLowerCase();
  return library.filter((s) => s.artist.toLowerCase().includes(target));
}
