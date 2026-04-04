import { getDailyPuzzle, getPuzzleNumber } from "@/lib/getDailyPuzzle";
import Game from "@/components/Game";
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

  return <Game puzzle={puzzle} puzzleNumber={puzzleNumber} />;
}
