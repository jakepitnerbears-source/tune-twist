import { getDailyPuzzle, getPuzzleNumber, loadScheduleAndLibrary } from "@/lib/getDailyPuzzle";
import GameClassic from "@/components/GameClassic";

export const revalidate = 3600; // revalidate once per hour — puzzle changes daily

export default function Home() {
  const puzzle = getDailyPuzzle();
  const puzzleNumber = getPuzzleNumber();
  const { library } = loadScheduleAndLibrary();
  const allArtists = [...new Set(library.map((s) => s.artist.replace(/\s*(ft\.|feat\.|featuring|&|\bwith\b|\bx\b).*$/i, "").trim()))].sort();
  return <GameClassic puzzle={puzzle} puzzleNumber={puzzleNumber} allArtists={allArtists} />;
}
