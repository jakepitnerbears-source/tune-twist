import { loadScheduleAndLibrary } from "@/lib/getDailyPuzzle";
import { Song } from "@/data/puzzles";

export const dynamic = "force-dynamic";

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-[color:var(--color-green)] text-[color:var(--color-navy)]",
  medium: "bg-yellow-400 text-[color:var(--color-navy)]",
  hard: "bg-[color:var(--color-coral)] text-white",
  viral: "bg-[color:var(--color-purple)] text-white",
};

const DIFFICULTY_ORDER = ["easy", "medium", "hard", "viral"];

function stripFeaturing(title: string): string {
  return title
    .replace(/\s*\(feat\..*?\)/gi, "")
    .replace(/\s*\(ft\..*?\)/gi, "")
    .replace(/\s*\(featuring.*?\)/gi, "")
    .replace(/\s*feat\..*$/gi, "")
    .replace(/\s*FEAT\..*$/g, "")
    .trim();
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function SongCard({ song, label }: { song: Song; label?: string }) {
  return (
    <div className="flex flex-col gap-2 border border-[color:var(--color-border)] rounded-xl p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-[color:var(--color-muted)] font-semibold uppercase tracking-wider">
          {label ?? song.id}
        </span>
        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${DIFFICULTY_COLORS[song.difficulty]}`}>
          {song.difficulty}
        </span>
      </div>

      <p className="text-lg font-bold leading-snug">
        {stripFeaturing(song.synonymTitle)}
      </p>

      <p className="text-sm text-[color:var(--color-muted)]">
        <span className="text-white font-semibold">{song.title}</span>
        {" — "}{song.artist}
        {" · "}{song.releaseYear}
      </p>

      <div className="flex flex-col gap-1 mt-1">
        {song.hints.map((hint, hi) => (
          <div
            key={hi}
            className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-[color:var(--color-navy)] border border-[color:var(--color-purple)] text-[color:var(--color-purple)]"
          >
            <span className="opacity-60">Hint {hi + 1}</span>
            <span>{hint}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PreviewPage() {
  const { schedule, library } = loadScheduleAndLibrary();
  const songMap = Object.fromEntries(library.map((s: Song) => [s.id, s]));

  const today = new Date().toISOString().split("T")[0];
  const futureDates = Object.keys(schedule).filter((d) => d >= today).sort();

  // Find unscheduled songs (in library but not in any upcoming slot)
  const scheduledIds = new Set(futureDates.flatMap((d) => schedule[d] as string[]));
  const unscheduled = library.filter((s: Song) => !scheduledIds.has(s.id));
  const byDiff = DIFFICULTY_ORDER.map((diff) => ({
    diff,
    songs: unscheduled.filter((s: Song) => s.difficulty === diff),
  })).filter(({ songs }) => songs.length > 0);

  return (
    <main className="flex flex-col items-center px-4 pt-10 pb-16">
      <div className="w-full max-w-[700px] flex flex-col gap-8">

        {/* ── Header ── */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Song Preview</h1>
          <p className="text-[color:var(--color-muted)] text-sm mt-1">
            testing only, not visible to users
          </p>
        </div>

        {/* ── Unscheduled library section ── */}
        {unscheduled.length > 0 && (
          <>
            <div className="border border-[color:var(--color-border)] rounded-2xl p-6 flex flex-col gap-6">
              <div className="text-center">
                <h2 className="text-xl font-bold tracking-tight">Unscheduled Library</h2>
                <p className="text-[color:var(--color-muted)] text-sm mt-1">
                  {unscheduled.length} songs in library not yet in the schedule — review before scheduling
                </p>
              </div>

              {byDiff.map(({ diff, songs }) => (
                <div key={diff} className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${DIFFICULTY_COLORS[diff]}`}>
                      {diff.toUpperCase()}
                    </span>
                    <span className="text-sm text-[color:var(--color-muted)]">{songs.length} songs</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {songs.map((song) => (
                      <SongCard key={song.id} song={song} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-[color:var(--color-border)] pt-4 text-center">
              <h2 className="text-xl font-bold tracking-tight">Scheduled Days</h2>
              <p className="text-[color:var(--color-muted)] text-sm mt-1">
                {futureDates.length} upcoming days
              </p>
            </div>
          </>
        )}

        {futureDates.map((date) => {
          const ids = schedule[date] as string[];
          const songs = ids.map((id) => songMap[id]).filter(Boolean) as Song[];

          return (
            <div
              key={date}
              className="flex flex-col gap-4 bg-[color:var(--color-card)] border border-[color:var(--color-border)] rounded-2xl p-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-widest text-[color:var(--color-muted)]">
                  {formatDate(date)}
                </h2>
                {date === today && (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-[color:var(--color-green)] text-[color:var(--color-navy)]">
                    Today
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-3">
                {songs.map((song, i) => (
                  <SongCard key={song.id} song={song} label={`Song ${i + 1}`} />
                ))}
              </div>
            </div>
          );
        })}

        {futureDates.length === 0 && (
          <p className="text-center text-[color:var(--color-muted)]">No upcoming scheduled songs found.</p>
        )}

      </div>
    </main>
  );
}
