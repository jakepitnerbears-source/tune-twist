import Link from "next/link";
import { loadScheduleAndLibrary, loadLyrics } from "@/lib/getDailyPuzzle";
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

function SongRow({ song, index, lyrics }: { song: Song; index: number; lyrics: Record<string, string> }) {
  const genreColor = GENRE_COLORS[song.genre ?? ""] ?? "bg-zinc-500/20 text-zinc-300";
  const lyric = lyrics[song.id];
  const hints = [song.hints[0], lyric ? `"${lyric}"` : null, song.hints[1]];

  return (
    <div className="flex flex-col gap-1.5 py-3 border-b border-[color:var(--color-border)] last:border-0">
      {/* Top row: index, synonym title, genre, artist, year */}
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-[10px] font-bold text-[color:var(--color-muted)] w-4 shrink-0">{index + 1}</span>
        <span className="text-sm font-semibold text-white leading-snug">{stripFeaturing(song.synonymTitle)}</span>
        <span className="text-xs text-[color:var(--color-muted)]">→ {song.title}</span>
        <span className="text-xs text-[color:var(--color-muted)]">— {song.artist} · {song.releaseYear}</span>
        {song.genre && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto shrink-0 ${genreColor}`}>
            {song.genre}
          </span>
        )}
      </div>

      {/* Hints row */}
      <div className="flex flex-wrap gap-1.5 pl-6">
        {hints.map((hint, hi) =>
          hint ? (
            <span
              key={hi}
              className="text-[10px] px-2 py-0.5 rounded-md bg-[color:var(--color-navy)] border border-[color:var(--color-purple)]/50 text-[color:var(--color-purple)]"
            >
              <span className="opacity-50">H{hi + 1}</span> {hint}
            </span>
          ) : (
            <span
              key={hi}
              className="text-[10px] px-2 py-0.5 rounded-md bg-[color:var(--color-navy)] border border-[color:var(--color-border)] text-[color:var(--color-muted)]"
            >
              <span className="opacity-50">H{hi + 1}</span> —
            </span>
          )
        )}
      </div>
    </div>
  );
}

export default function PreviewPage() {
  const { schedule, library } = loadScheduleAndLibrary();
  const lyrics = loadLyrics();
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
    <main className="flex flex-col items-center px-4 pt-8 pb-16">
      <div className="w-full max-w-[800px] flex flex-col gap-6">

        <div className="flex items-baseline justify-between">
          <h1 className="text-xl font-bold tracking-tight">Preview</h1>
          <p className="text-[color:var(--color-muted)] text-xs">
            {library.length} songs · {scheduledDays.length} scheduled · {unscheduled.length} unscheduled
          </p>
        </div>

        {/* Scheduled days */}
        <div className="flex items-center gap-2 pb-1 border-b border-[color:var(--color-purple)]">
          <h2 className="text-sm font-bold uppercase tracking-widest text-[color:var(--color-purple)]">Scheduled</h2>
          <span className="text-xs text-[color:var(--color-muted)] ml-auto">{scheduledDays.length} days</span>
        </div>

        {scheduledDays.map(({ date, ids }) => {
          const songs = ids.map((id: string) => songMap[id]).filter(Boolean) as Song[];
          return (
            <div
              key={date}
              className="bg-[color:var(--color-card)] border border-[color:var(--color-border)] rounded-xl px-4 py-2"
            >
              <div className="flex items-center justify-between py-2 border-b border-[color:var(--color-border)]">
                <span className="text-xs font-bold text-[color:var(--color-muted)] uppercase tracking-widest">
                  {formatDate(date)}
                </span>
                <div className="flex items-center gap-2">
                  {date === today && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[color:var(--color-green)] text-[color:var(--color-navy)]">
                      Today
                    </span>
                  )}
                  <Link
                    href={`/play/${date}`}
                    className="text-[10px] font-semibold text-[color:var(--color-purple)] hover:text-white transition-colors"
                  >
                    Play →
                  </Link>
                </div>
              </div>
              {songs.map((song, i) => (
                <SongRow key={song.id} song={song} index={i} lyrics={lyrics} />
              ))}
            </div>
          );
        })}

        {scheduledDays.length === 0 && (
          <p className="text-center text-[color:var(--color-muted)] text-sm">No upcoming scheduled days.</p>
        )}

        {/* Unscheduled */}
        {unscheduled.length > 0 && (
          <>
            <div className="flex items-center gap-2 pb-1 border-b border-[color:var(--color-border)]">
              <h2 className="text-sm font-bold uppercase tracking-widest text-[color:var(--color-muted)]">Unscheduled</h2>
              <span className="text-xs text-[color:var(--color-muted)] ml-auto">{unscheduled.length} songs</span>
            </div>

            {genreGroups.map(({ genre, songs }) => (
              <div key={genre} className="flex flex-col gap-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${GENRE_COLORS[genre] ?? "bg-zinc-500/20 text-zinc-300"}`}>
                    {genre}
                  </span>
                  <span className="text-xs text-[color:var(--color-muted)]">{songs.length}</span>
                </div>
                <div className="bg-[color:var(--color-card)] border border-[color:var(--color-border)] rounded-xl px-4 py-0">
                  {songs.map((song, i) => (
                    <SongRow key={song.id} song={song} index={i} lyrics={lyrics} />
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
