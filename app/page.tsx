import { getDailyPuzzle, getPuzzleNumber } from "@/lib/getDailyPuzzle";
import Game from "@/components/Game";

export const revalidate = 3600; // revalidate once per hour — puzzle changes daily

export default function Home() {
  const puzzle = getDailyPuzzle();
  const puzzleNumber = getPuzzleNumber();
  return <Game puzzle={puzzle} puzzleNumber={puzzleNumber} />;
}
