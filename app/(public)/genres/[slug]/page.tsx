import { getGenrePuzzle, GENRES } from "@/lib/getGenrePuzzle";
import { loadScheduleAndLibrary, loadLyrics } from "@/lib/getDailyPuzzle";
import GameClassic from "@/components/GameClassic";
import { notFound } from "next/navigation";

export default async function GenrePlayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const genre = GENRES.find((g) => g.slug === slug);
  if (!genre) notFound();

  const puzzle = getGenrePuzzle(slug);
  if (!puzzle || puzzle.length < 5) notFound();

  const { library } = loadScheduleAndLibrary();
  const allArtists = [...new Set(library.map((s) => s.artist.replace(/\s*(ft\.|feat\.|featuring).*$/i, "").trim()))].sort();
  const lyrics = loadLyrics();

  return <GameClassic puzzle={puzzle} genreLabel={genre.name} allArtists={allArtists} lyrics={lyrics} />;
}
