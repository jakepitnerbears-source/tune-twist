import Link from "next/link";

const EPOCH = new Date("2026-04-13T12:00:00");
const CYCLE_LENGTH = 120;

function dateForDay(day: number): string {
  const d = new Date(EPOCH);
  d.setDate(d.getDate() + day);
  return d.toISOString().slice(0, 10);
}

export default function PlayOverview() {
  const today = new Date().toISOString().slice(0, 10);

  const days = Array.from({ length: CYCLE_LENGTH }, (_, i) => ({
    day: i + 1,
    date: dateForDay(i),
  }));

  return (
    <main className="min-h-screen bg-[color:var(--color-bg)] px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-6 text-center">Schedule Overview</h1>
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-w-3xl mx-auto">
        {days.map(({ day, date }) => {
          const isToday = date === today;
          return (
            <Link
              key={date}
              href={`/play/${date}`}
              className={[
                "flex flex-col items-center justify-center rounded-xl py-3 px-1 text-center transition-opacity hover:opacity-80",
                isToday
                  ? "bg-[color:var(--color-purple)] text-white font-bold"
                  : "bg-[color:var(--color-navy)] text-[color:var(--color-text-muted)]",
              ].join(" ")}
            >
              <span className="text-xs opacity-60">#{day}</span>
              <span className="text-xs mt-0.5 font-mono">
                {date.slice(5).replace("-", "/")}
              </span>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
