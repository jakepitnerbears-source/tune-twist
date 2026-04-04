import { getDailyPuzzle, getPuzzleNumber } from "@/lib/getDailyPuzzle";
import Game from "@/components/Game";

export const dynamic = "force-dynamic";

export default function Home() {
  const puzzle = getDailyPuzzle();
  const puzzleNumber = getPuzzleNumber();
  return <Game puzzle={puzzle} puzzleNumber={puzzleNumber} />;
}
