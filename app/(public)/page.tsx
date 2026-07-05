import type { Metadata } from "next";
import { getDailyPuzzle, getPuzzleNumber, loadScheduleAndLibrary, loadLyrics } from "@/lib/getDailyPuzzle";
import GameClassic from "@/components/GameClassic";
import { notFound } from "next/navigation";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "TuneTwist — Daily Music Word Game",
  description: "Every day, 5 song titles get rewritten with synonyms. Can you decode them all? Free daily music puzzle.",
};

export default async function Home() {
  const puzzle = getDailyPuzzle();
  const puzzleNumber = getPuzzleNumber();

  if (!puzzle || puzzle.length === 0) notFound();

  const { library } = loadScheduleAndLibrary();
  const allArtists = [...new Set(library.map((s) => s.artist.replace(/\s*(ft\.|feat\.|featuring).*$/i, "").trim()))].sort();
  const lyrics = loadLyrics();

  return <GameClassic puzzle={puzzle} puzzleNumber={puzzleNumber} allArtists={allArtists} lyrics={lyrics} />;
}
