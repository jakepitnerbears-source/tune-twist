import type { Metadata } from "next";
import { getDailyPuzzle, getPuzzleNumber, loadScheduleAndLibrary, loadLyrics } from "@/lib/getDailyPuzzle";
import GameV2 from "@/components/GameV2";

export const revalidate = 0;

export const metadata: Metadata = {
  alternates: {
    canonical: "/play",
  },
};

function todayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const GAME_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Game",
  name: "TuneTwist",
  url: "https://tunetwist.io/play",
  genre: "Puzzle",
  isAccessibleForFree: true,
  description: "Every day, 5 song titles get rewritten with synonyms. Decode them back to the real title.",
};

export default function PlayToday() {
  const date = todayDateString();
  const puzzle = getDailyPuzzle(date);
  const puzzleNumber = getPuzzleNumber(date);
  const { library } = loadScheduleAndLibrary();
  const allArtists = [...new Set(library.map((s) => s.artist.replace(/\s*(ft\.|feat\.|featuring).*$/i, "").trim()))].sort();
  const lyrics = loadLyrics();

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(GAME_JSON_LD) }} />
      <GameV2 puzzle={puzzle} puzzleNumber={puzzleNumber} allArtists={allArtists} lyrics={lyrics} />
    </>
  );
}
