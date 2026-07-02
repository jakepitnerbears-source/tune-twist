import { loadScheduleAndLibrary, loadLyrics } from "@/lib/getDailyPuzzle";
import GameClassic from "@/components/GameClassic";
import { notFound } from "next/navigation";
import { Song } from "@/data/puzzles";

export const dynamic = "force-dynamic";

export default async function PlayTest({
  searchParams,
}: {
  searchParams: Promise<{ songs?: string }>;
}) {
  const { songs: songsParam } = await searchParams;
  if (!songsParam) notFound();

  const ids = songsParam.split(",").map((s) => s.trim()).filter(Boolean);
  if (ids.length !== 5) notFound();

  const { library } = loadScheduleAndLibrary();
  const songMap = Object.fromEntries(library.map((s) => [s.id, s]));
  const puzzle = ids.map((id) => songMap[id]).filter(Boolean) as Song[];

  if (puzzle.length !== 5) notFound();

  const lyrics = loadLyrics();
  const allArtists = [...new Set(library.map((s) => s.artist.replace(/\s*(ft\.|feat\.|featuring).*$/i, "").trim()))].sort();

  return <GameClassic puzzle={puzzle} allArtists={allArtists} lyrics={lyrics} genreLabel="Test Day" />;
}
