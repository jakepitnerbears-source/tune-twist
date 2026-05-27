import Link from "next/link";
import { loadScheduleAndLibrary } from "@/lib/getDailyPuzzle";
import { Song } from "@/data/puzzles";

export const dynamic = "force-dynamic";

const EPOCH_MS = new Date("2026-04-13T12:00:00").getTime();

function dayIndexToDateString(dayIndex: number): string {
  const ms = EPOCH_MS + dayIndex * 86_400_000;
  const d = new Date(ms);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

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

const GENRE_COLORS: Record<string, string> = {
  "Pop":         "bg-pink-500/20 text-pink-300",
  "R&B":         "bg-orange-500/20 text-orange-300",
  "Hip-Hop":     "bg-yellow-500/20 text-yellow-300",
  "Rock":        "bg-red-500/20 text-red-400",
  "Alternative": "bg-rose-500/20 text-rose-300",
  "Indie":       "bg-lime-500/20 text-lime-300",
  "Electronic":  "bg-cyan-500/20 text-cyan-300",
  "Country":     "bg-amber-500/20 text-amber-300",
  "Metal":       "bg-zinc-500/20 text-zinc-300",
  "Funk/Disco":  "bg-purple-500/20 text-purple-300",
  "Latin":       "bg-emerald-500/20 text-emerald-300",
  "Pop-Punk":    "bg-fuchsia-500/20 text-fuchsia-300",
};

function SongCard({ song, label }: { song: Song; label?: string }) {
  const genreColor = GENRE_COLORS[song.genre ?? ""] ?? "bg-zinc-500/20 text-zinc-300";
  return (
    <div className="flex flex-col gap-2 border border-[color:var(--color-border)] rounded-xl p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-[color:var(--color-muted)] font-semibold uppercase tracking-wider">
          {label ?? song.id}
        </span>
        {song.genre && (
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${genreColor}`}>
            {song.genre}
          </span>
        )}
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

  const scheduledDays = schedule
    .map((ids, dayIndex) => ({ date: dayIndexToDateString(dayIndex), ids }))
    .filter(({ date }) => date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));

  const scheduledIds = new Set(schedule.flat());
  const unscheduled = library.filter((s: Song) => !scheduledIds.has(s.id));
  const genreGroups = Array.from(new Set(unscheduled.map((s: Song) => s.genre ?? "Other")))
    .sort()
    .map((genre) => ({
      genre,
      songs: unscheduled.filter((s: Song) => (s.genre ?? "Other") === genre),
    }));

  return (
    <main className="flex flex-col items-center px-4 pt-10 pb-16">
      <div className="w-full max-w-[700px] flex flex-col gap-8">

        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Song Preview</h1>
          <p className="text-[color:var(--color-muted)] text-sm mt-1">
            {library.length} songs · {scheduledDays.length} days scheduled · {unscheduled.length} unscheduled
          </p>
        </div>

        {/* Upcoming scheduled days */}
        <div className="flex items-center gap-3 pb-2 border-b-2 border-[color:var(--color-purple)]">
          <h2 className="text-xl font-bold tracking-tight">Scheduled Days</h2>
          <span className="text-sm text-[color:var(--color-muted)] ml-auto">{scheduledDays.length} upcoming</span>
        </div>

        {scheduledDays.map(({ date, ids }) => {
          const songs = ids.map((id: string) => songMap[id]).filter(Boolean) as Song[];
          return (
            <div
              key={date}
              className="flex flex-col gap-4 bg-[color:var(--color-card)] border border-[color:var(--color-border)] rounded-2xl p-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-widest text-[color:var(--color-muted)]">
                  {formatDate(date)}
                </h2>
                <div className="flex items-center gap-2">
                  {date === today && (
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-[color:var(--color-green)] text-[color:var(--color-navy)]">
                      Today
                    </span>
                  )}
                  <Link
                    href={`/play/${date}`}
                    className="text-xs font-semibold px-3 py-1 rounded-full border border-[color:var(--color-purple)]/40 text-[color:var(--color-purple)] hover:bg-[color:var(--color-purple)]/10 transition-colors"
                  >
                    Play →
                  </Link>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {songs.map((song, i) => (
                  <SongCard key={song.id} song={song} label={`Song ${i + 1}`} />
                ))}
              </div>
            </div>
          );
        })}

        {scheduledDays.length === 0 && (
          <p className="text-center text-[color:var(--color-muted)]">No upcoming scheduled days.</p>
        )}

        {/* Unscheduled songs */}
        {unscheduled.length > 0 && (
          <>
            <div className="flex items-center gap-3 pb-2 border-b-2 border-[color:var(--color-border)]">
              <h2 className="text-xl font-bold tracking-tight">Unscheduled Library</h2>
              <span className="text-sm text-[color:var(--color-muted)] ml-auto">{unscheduled.length} songs</span>
            </div>

            {genreGroups.map(({ genre, songs }) => (
              <div key={genre} className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${GENRE_COLORS[genre] ?? "bg-zinc-500/20 text-zinc-300"}`}>
                    {genre}
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
          </>
        )}

      </div>
    </main>
  );
}
