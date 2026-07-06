import { getDailyPuzzle, loadScheduleAndLibrary, loadLyrics } from "@/lib/getDailyPuzzle";
import GameV2 from "@/components/GameV2";
import { notFound } from "next/navigation";

export default function GameV2Page() {
  const puzzle = getDailyPuzzle();
  if (!puzzle || puzzle.length === 0) notFound();

  const { library } = loadScheduleAndLibrary();
  const allArtists = [...new Set(library.map((s) => s.artist.replace(/\s*(ft\.|feat\.|featuring).*$/i, "").trim()))].sort();
  const lyrics = loadLyrics();

  return <GameV2 puzzle={puzzle} allArtists={allArtists} lyrics={lyrics} />;
}
