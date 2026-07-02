import Link from "next/link";

const EPOCH = new Date("2026-04-13T12:00:00Z");
const CYCLE_LENGTH = 120;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function dateForDay(day: number): string {
  const d = new Date(EPOCH);
  d.setUTCDate(d.getUTCDate() + day);
  return d.toISOString().slice(0, 10);
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function firstWeekdayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export default function PlayOverview() {
  const today = new Date().toISOString().slice(0, 10);

  // Build a map of date → puzzle day number
  const puzzleDates = new Map<string, number>();
  for (let i = 0; i < CYCLE_LENGTH; i++) {
    puzzleDates.set(dateForDay(i), i + 1);
  }

  // Group puzzle dates by year-month
  const monthKeys: string[] = [];
  const byMonth = new Map<string, Map<number, number>>(); // monthKey → { dayOfMonth → puzzleDay }

  for (const [date, puzzleDay] of puzzleDates) {
    const [year, month, dom] = date.split("-").map(Number);
    const key = `${year}-${String(month).padStart(2, "0")}`;
    if (!byMonth.has(key)) {
      byMonth.set(key, new Map());
      monthKeys.push(key);
    }
    byMonth.get(key)!.set(dom, puzzleDay);
  }

  monthKeys.sort();

  return (
    <main className="flex flex-col items-center px-4 pt-8 pb-16">
      <div className="w-full max-w-[860px] flex flex-col gap-10">

        <div className="flex items-baseline justify-between">
          <h1 className="text-xl font-bold tracking-tight">Schedule Overview</h1>
          <span className="text-xs text-[color:var(--color-muted)]">{CYCLE_LENGTH} days · {CYCLE_LENGTH} puzzles</span>
        </div>

        {monthKeys.map((key) => {
          const [year, month] = key.split("-").map(Number);
          const puzzleDaysInMonth = byMonth.get(key)!;
          const totalDays = daysInMonth(year, month - 1);
          const firstWeekday = firstWeekdayOfMonth(year, month - 1);

          // Build grid cells: empty slots + all days of month
          const cells: (number | null)[] = [
            ...Array(firstWeekday).fill(null),
            ...Array.from({ length: totalDays }, (_, i) => i + 1),
          ];
          // Pad to full weeks
          while (cells.length % 7 !== 0) cells.push(null);

          const monthHasPuzzles = puzzleDaysInMonth.size > 0;

          return (
            <div key={key} className="flex flex-col gap-3">
              {/* Month header */}
              <div className="flex items-baseline gap-3 pb-2 border-b border-[color:var(--color-border)]">
                <h2 className="text-base font-bold tracking-tight">
                  {MONTH_NAMES[month - 1]} <span className="text-[color:var(--color-muted)] font-normal">{year}</span>
                </h2>
                {monthHasPuzzles && (
                  <span className="text-xs text-[color:var(--color-muted)]">{puzzleDaysInMonth.size} puzzle{puzzleDaysInMonth.size !== 1 ? "s" : ""}</span>
                )}
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-1">
                {WEEKDAYS.map((wd) => (
                  <div key={wd} className="text-center text-[10px] font-semibold uppercase tracking-widest text-[color:var(--color-muted)] py-1">
                    {wd}
                  </div>
                ))}

                {/* Day cells */}
                {cells.map((dom, i) => {
                  if (dom === null) {
                    return <div key={`empty-${i}`} />;
                  }

                  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(dom).padStart(2, "0")}`;
                  const puzzleDay = puzzleDaysInMonth.get(dom);
                  const isToday = dateStr === today;
                  const isPast = dateStr < today;

                  if (!puzzleDay) {
                    // Non-puzzle day — show faint number
                    return (
                      <div
                        key={dom}
                        className="flex flex-col items-center justify-center rounded-lg py-2 text-center"
                      >
                        <span className="text-xs text-[color:var(--color-muted)] opacity-25">{dom}</span>
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={dom}
                      href={`/play/${dateStr}`}
                      className={[
                        "flex flex-col items-center justify-center rounded-lg py-2 text-center transition-all hover:scale-105",
                        isToday
                          ? "bg-[color:var(--color-purple)] text-white ring-2 ring-[color:var(--color-purple)] ring-offset-2 ring-offset-[color:var(--color-navy)]"
                          : isPast
                          ? "bg-[color:var(--color-card)] border border-[color:var(--color-border)] text-[color:var(--color-muted)]"
                          : "bg-[color:var(--color-card)] border border-[color:var(--color-purple)]/30 text-white hover:border-[color:var(--color-purple)]",
                      ].join(" ")}
                    >
                      <span className={`text-sm font-bold leading-none ${isToday ? "text-white" : ""}`}>{dom}</span>
                      <span className={`text-[9px] mt-0.5 ${isToday ? "text-white/70" : "text-[color:var(--color-muted)]"}`}>#{puzzleDay}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}

      </div>
    </main>
  );
}
