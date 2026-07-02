import { loadScheduleAndLibrary } from "@/lib/getDailyPuzzle";
import { Song } from "@/data/puzzles";
import SongManager from "./SongManager";

export const dynamic = "force-dynamic";

export default function AdminSongsPage() {
  const { library } = loadScheduleAndLibrary();
  const sorted = [...library].sort((a: Song, b: Song) =>
    a.title.localeCompare(b.title)
  );

  return (
    <main className="flex flex-col items-center px-4 pt-8 pb-16">
      <div className="w-full max-w-[1200px] flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Song Library</h1>
          <p className="text-sm text-[color:var(--color-muted)] mt-1">
            {library.length} songs · Mark songs to remove or fix synonyms, then push to deploy
          </p>
        </div>
        <SongManager initialSongs={sorted} />
      </div>
    </main>
  );
}
