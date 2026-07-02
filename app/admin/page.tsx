import Link from "next/link";
import { loadScheduleAndLibrary } from "@/lib/getDailyPuzzle";
import { Song } from "@/data/puzzles";

export const dynamic = "force-dynamic";

const EPOCH_MS = new Date("2026-04-13T12:00:00").getTime();

function dayIndexToDateString(dayIndex: number): string {
  const ms = EPOCH_MS + dayIndex * 86_400_000;
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
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

export default function AdminPage() {
  const { schedule, library } = loadScheduleAndLibrary();
  const songMap = Object.fromEntries(library.map((s: Song) => [s.id, s]));
  const today = new Date().toISOString().split("T")[0];

  const allScheduledDays = schedule.map((ids, dayIndex) => ({
    date: dayIndexToDateString(dayIndex),
    dayNumber: dayIndex + 1,
    songs: ids.map((id: string) => songMap[id]).filter(Boolean) as Song[],
  }));

  const upcomingDays = allScheduledDays
    .filter(({ date }) => date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));

  const todayEntry = upcomingDays.find(({ date }) => date === today);
  const nextDays = upcomingDays.filter(({ date }) => date > today).slice(0, 14);

  const scheduledIds = new Set(schedule.flat());
  const unscheduled = library.filter((s: Song) => !scheduledIds.has(s.id));

  const genreGroups = Array.from(new Set(library.map((s: Song) => s.genre ?? "Other")))
    .sort()
    .map((genre) => ({
      genre,
      total: library.filter((s: Song) => (s.genre ?? "Other") === genre).length,
    }));

  return (
    <main className="flex flex-col items-center px-4 pt-8 pb-16">
      <div className="w-full max-w-[860px] flex flex-col gap-8">

        {/* Header */}
        <div className="flex items-baseline justify-between">
          <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
          <span className="text-xs text-[color:var(--color-muted)]">{formatDate(today)}</span>
        </div>

        {/* Stat row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Songs", value: library.length, href: "/admin/library" },
            { label: "Days Scheduled", value: upcomingDays.length, href: "/admin/play" },
            { label: "Unscheduled", value: unscheduled.length, href: "/admin/preview" },
          ].map(({ label, value, href }) => (
            <Link
              key={label}
              href={href}
              className="flex flex-col gap-1 bg-[color:var(--color-card)] border border-[color:var(--color-border)] rounded-xl p-4 hover:border-[color:var(--color-purple)]/60 transition-colors"
            >
              <span className="text-2xl font-bold">{value}</span>
              <span className="text-xs text-[color:var(--color-muted)]">{label}</span>
            </Link>
          ))}
        </div>

        {/* Today */}
        <div className="flex flex-col gap-0">
          <div className="flex items-center justify-between pb-2 border-b border-[color:var(--color-border)]">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[color:var(--color-muted)]">Today</h2>
            {todayEntry && (
              <Link href={`/play/${today}`} className="text-xs font-semibold text-[color:var(--color-purple)] hover:text-white transition-colors">
                Play →
              </Link>
            )}
          </div>

          {todayEntry ? (
            <div className="bg-[color:var(--color-card)] border border-[color:var(--color-purple)]/40 rounded-xl overflow-hidden mt-3">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-[color:var(--color-border)]">
                <span className="text-xs font-semibold text-white">{formatDate(today)}</span>
                <span className="text-xs text-[color:var(--color-muted)]">Puzzle #{todayEntry.dayNumber}</span>
              </div>
              {todayEntry.songs.map((song, i) => (
                <div key={song.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-[color:var(--color-border)] last:border-0">
                  <span className="text-[10px] text-[color:var(--color-muted)] w-4 shrink-0">{i + 1}</span>
                  <span className="text-sm font-medium text-white flex-1 min-w-0 truncate">{song.title}</span>
                  <span className="text-xs text-[color:var(--color-muted)] truncate hidden sm:block">{song.artist}</span>
                  {song.genre && (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${GENRE_COLORS[song.genre] ?? "bg-zinc-500/20 text-zinc-300"}`}>
                      {song.genre}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[color:var(--color-muted)] py-4">No puzzle scheduled for today.</p>
          )}
        </div>

        {/* Upcoming — compact rows */}
        <div className="flex flex-col gap-0">
          <div className="flex items-center justify-between pb-2 border-b border-[color:var(--color-border)]">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[color:var(--color-muted)]">Upcoming</h2>
            <Link href="/admin/preview" className="text-xs text-[color:var(--color-muted)] hover:text-white transition-colors">
              Full preview →
            </Link>
          </div>

          {nextDays.length > 0 ? (
            <div className="flex flex-col">
              {nextDays.map(({ date, dayNumber, songs }) => (
                <div key={date} className="flex items-center gap-4 py-2.5 border-b border-[color:var(--color-border)] last:border-0 group">
                  <span className="text-xs font-semibold text-white w-24 shrink-0">{formatDate(date)}</span>
                  <span className="text-[10px] text-[color:var(--color-muted)] w-8 shrink-0">#{dayNumber}</span>
                  <span className="flex-1 text-xs text-[color:var(--color-muted)] truncate min-w-0">
                    {songs.map(s => s.title).join(" · ")}
                  </span>
                  <Link
                    href={`/play/${date}`}
                    className="text-[10px] font-semibold text-[color:var(--color-purple)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  >
                    Play →
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[color:var(--color-muted)] py-4">No upcoming scheduled days.</p>
          )}
        </div>

        {/* Genre breakdown */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-[color:var(--color-border)]">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[color:var(--color-muted)]">Library by Genre</h2>
            <Link href="/admin/library" className="text-xs text-[color:var(--color-muted)] hover:text-white transition-colors">
              View library →
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {genreGroups.map(({ genre, total }) => (
              <span
                key={genre}
                className={`text-xs font-semibold px-3 py-1 rounded-full ${GENRE_COLORS[genre] ?? "bg-zinc-500/20 text-zinc-300"}`}
              >
                {genre} · {total}
              </span>
            ))}
          </div>
          {unscheduled.length > 0 && (
            <Link href="/admin/preview" className="text-xs text-[color:var(--color-muted)] hover:text-white transition-colors w-fit">
              {unscheduled.length} songs unscheduled →
            </Link>
          )}
        </div>

      </div>
    </main>
  );
}
