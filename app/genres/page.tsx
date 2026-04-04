import Link from "next/link";
import { GENRES, getGenrePool } from "@/lib/getGenrePuzzle";

export default function GenresPage() {
  const genresWithCounts = GENRES.map((g) => ({
    ...g,
    count: getGenrePool(g.slug).length,
  }));

  return (
    <main className="flex flex-col items-center px-4 pt-10 pb-10">
      <div className="w-full max-w-[560px] flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Explore by Genre</h1>
          <p className="text-[color:var(--color-muted)] text-sm mt-1">
            Pick a vibe. Play 5 songs.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {genresWithCounts.map((g) => {
            const playable = g.count >= 5;
            return (
              <Link
                key={g.slug}
                href={`/genres/${g.slug}`}
                className={`flex flex-col gap-2 p-4 rounded-xl border transition-all ${
                  playable
                    ? "border-[color:var(--color-border)] bg-[color:var(--color-card)] hover:border-[color:var(--color-green)]"
                    : "border-[color:var(--color-border)] bg-[color:var(--color-card)] opacity-50 pointer-events-none"
                }`}
              >
                <span className="text-3xl">{g.emoji}</span>
                <span className="font-bold text-sm leading-tight">{g.name}</span>
                <span className="text-xs text-[color:var(--color-muted)] leading-snug">{g.desc}</span>
                <span
                  className={`mt-auto text-xs font-semibold ${
                    playable ? "text-[color:var(--color-green)]" : "text-[color:var(--color-muted)]"
                  }`}
                >
                  {playable ? `${g.count} songs →` : "Coming soon"}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
