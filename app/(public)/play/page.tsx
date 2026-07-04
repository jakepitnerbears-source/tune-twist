import { getDailyPuzzle, getPuzzleNumber, loadScheduleAndLibrary, loadLyrics } from "@/lib/getDailyPuzzle";
import GameClassic from "@/components/GameClassic";
import { notFound } from "next/navigation";

export const revalidate = 0;

export default async function PlayToday() {
  const puzzle = getDailyPuzzle();
  const puzzleNumber = getPuzzleNumber();

  if (!puzzle || puzzle.length === 0) notFound();

  const { library } = loadScheduleAndLibrary();
  const allArtists = [...new Set(library.map((s) => s.artist.replace(/\s*(ft\.|feat\.|featuring).*$/i, "").trim()))].sort();
  const lyrics = loadLyrics();

  return <GameClassic puzzle={puzzle} puzzleNumber={puzzleNumber} allArtists={allArtists} lyrics={lyrics} />;
}
