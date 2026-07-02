import { getDailyPuzzle, getPuzzleNumber, loadScheduleAndLibrary } from "@/lib/getDailyPuzzle";
import GameMedia from "@/components/GameMedia";

export const revalidate = 3600;

export default function MediaPage() {
  const puzzle = getDailyPuzzle();
  const puzzleNumber = getPuzzleNumber();
  const { library } = loadScheduleAndLibrary();
  const allArtists = [...new Set(library.map((s) => s.artist.replace(/\s*(ft\.|feat\.|featuring).*$/i, "").trim()))].sort();
  return <GameMedia puzzle={puzzle} puzzleNumber={puzzleNumber} allArtists={allArtists} />;
}
