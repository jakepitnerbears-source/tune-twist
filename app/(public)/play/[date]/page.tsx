import { getDailyPuzzle, getPuzzleNumber, loadScheduleAndLibrary, loadLyrics } from "@/lib/getDailyPuzzle";
import GameV2 from "@/components/GameV2";
import { notFound, redirect } from "next/navigation";

export const revalidate = 0;

function todayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default async function PlayDate({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;

  // Basic date format guard
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();

  // Block access to today or future dates — use /play instead
  if (date >= todayDateString()) redirect("/play");

  const puzzle = getDailyPuzzle(date);
  if (!puzzle || puzzle.length === 0) notFound();

  const puzzleNumber = getPuzzleNumber(date);
  const { library } = loadScheduleAndLibrary();
  const allArtists = [...new Set(library.map((s) => s.artist.replace(/\s*(ft\.|feat\.|featuring).*$/i, "").trim()))].sort();
  const lyrics = loadLyrics();

  return <GameV2 puzzle={puzzle} puzzleNumber={puzzleNumber} allArtists={allArtists} lyrics={lyrics} />;
}
