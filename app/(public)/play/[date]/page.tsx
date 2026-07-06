import { getDailyPuzzle, getPuzzleNumber, loadScheduleAndLibrary, loadLyrics } from "@/lib/getDailyPuzzle";
import GameV2 from "@/components/GameV2";
import { notFound } from "next/navigation";

export const revalidate = 0;

export default async function PlayDate({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;

  // Basic date format guard
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();

  const puzzle = getDailyPuzzle(date);
  if (!puzzle || puzzle.length === 0) notFound();

  const puzzleNumber = getPuzzleNumber(date);
  const { library } = loadScheduleAndLibrary();
  const allArtists = [...new Set(library.map((s) => s.artist.replace(/\s*(ft\.|feat\.|featuring).*$/i, "").trim()))].sort();
  const lyrics = loadLyrics();

  return <GameV2 puzzle={puzzle} puzzleNumber={puzzleNumber} allArtists={allArtists} lyrics={lyrics} />;
}
