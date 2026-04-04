import { getGenrePuzzle, GENRES } from "@/lib/getGenrePuzzle";
import Game from "@/components/Game";
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

  return <Game puzzle={puzzle} genreLabel={genre.name} />;
}
