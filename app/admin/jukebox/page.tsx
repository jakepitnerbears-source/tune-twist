import { getDailyPuzzle, getPuzzleNumber, loadScheduleAndLibrary } from "@/lib/getDailyPuzzle";
import GameJukebox from "@/components/GameJukebox";

export const revalidate = 3600;

export default function JukeboxPage() {
  const puzzle = getDailyPuzzle();
  const puzzleNumber = getPuzzleNumber();
  const { library } = loadScheduleAndLibrary();
  const allArtists = [...new Set(library.map((s) => s.artist.replace(/\s*(ft\.|feat\.|featuring).*$/i, "").trim()))].sort();
  return <GameJukebox puzzle={puzzle} puzzleNumber={puzzleNumber} allArtists={allArtists} />;
}
