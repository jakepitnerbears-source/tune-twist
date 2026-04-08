import Link from "next/link";
import { loadScheduleAndLibrary } from "@/lib/getDailyPuzzle";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export const revalidate = 3600;

export default function ArchivePage() {
  const { schedule } = loadScheduleAndLibrary();
  const today = new Date().toISOString().split("T")[0];

  const allDates = Object.keys(schedule).sort();
  const pastDates = allDates.filter((d) => d <= today).reverse(); // newest first
  const futureDates = allDates.filter((d) => d > today);

  return (
    <main className="flex flex-col items-center px-4 pt-10 pb-10">
      <div className="w-full max-w-[560px] flex flex-col gap-8">

        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Archive</h1>
          <p className="text-[color:var(--color-muted)] text-sm mt-1">
            {pastDates.length} past days · {futureDates.length} upcoming
          </p>
        </div>

        {/* Past + today */}
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[color:var(--color-muted)]">
            Past Days
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {pastDates.map((date) => {
              const isToday = date === today;
              return (
                <Link
                  key={date}
                  href={`/play/${date}`}
                  className={`flex flex-col gap-1 p-4 rounded-2xl border transition-all hover:border-[color:var(--color-green)] ${
                    isToday
                      ? "border-[color:var(--color-green)] bg-[color:var(--color-card)]"
                      : "border-[color:var(--color-border)] bg-[color:var(--color-card)]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-white">{formatDate(date)}</span>
                    {isToday && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[color:var(--color-green)] text-[color:var(--color-navy)]">
                        Today
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-[color:var(--color-muted)]">5 songs</span>
                  <span className="mt-1 text-xs font-semibold text-[color:var(--color-green)]">
                    Play →
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Future days */}
        {futureDates.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[color:var(--color-muted)]">
              Coming Soon
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {futureDates.map((date) => (
                <Link
                  key={date}
                  href={`/play/${date}`}
                  className="flex flex-col gap-1 p-4 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-card)] opacity-60 hover:opacity-100 hover:border-[color:var(--color-purple)] transition-all"
                >
                  <span className="text-sm font-bold text-white">{formatDate(date)}</span>
                  <span className="text-xs text-[color:var(--color-muted)]">5 songs</span>
                  <span className="mt-1 text-xs font-semibold text-[color:var(--color-purple)]">
                    Preview →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
