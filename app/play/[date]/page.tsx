import { getDailyPuzzle, getPuzzleNumber, loadScheduleAndLibrary } from "@/lib/getDailyPuzzle";
import GameClassic from "@/components/GameClassic";
import { notFound } from "next/navigation";

export default async function PlayDate({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();

  const puzzle = getDailyPuzzle(date);
  const puzzleNumber = getPuzzleNumber(date);

  if (!puzzle || puzzle.length === 0) notFound();

  const { library } = loadScheduleAndLibrary();
  const allArtists = [...new Set(library.map((s) => s.artist.replace(/\s*(ft\.|feat\.|featuring).*$/i, "").trim()))].sort();

  return <GameClassic puzzle={puzzle} puzzleNumber={puzzleNumber} allArtists={allArtists} />;
}
