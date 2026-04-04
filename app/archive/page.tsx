import Link from "next/link";
import { loadScheduleAndLibrary } from "@/lib/getDailyPuzzle";

const TEST_DAYS = Array.from({ length: 20 }, (_, i) => {
  const d = new Date("2026-03-12");
  d.setDate(d.getDate() + i);
  return d.toISOString().split("T")[0];
});

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function ArchivePage() {
  const { schedule } = loadScheduleAndLibrary();

  return (
    <main className="flex flex-col items-center px-4 pt-10 pb-10">
      <div className="w-full max-w-[560px] flex flex-col gap-6">

        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Test Archive</h1>
          <p className="text-[color:var(--color-muted)] text-sm mt-1">
            20 test sessions for development. Each day has 5 unique songs.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {TEST_DAYS.map((date) => {
            const hasContent = !!schedule[date];
            return (
              <Link
                key={date}
                href={`/play/${date}`}
                className={`flex flex-col gap-1 p-4 rounded-xl border transition-all ${
                  hasContent
                    ? "border-[color:var(--color-border)] bg-[color:var(--color-card)] hover:border-[color:var(--color-green)] hover:bg-[color:var(--color-card)]"
                    : "border-[color:var(--color-border)] bg-[color:var(--color-card)] opacity-40 pointer-events-none"
                }`}
              >
                <span className="text-sm font-bold text-white">{formatDate(date)}</span>
                <span className="text-xs text-[color:var(--color-muted)]">
                  {hasContent ? "5 songs" : "No content"}
                </span>
                <span
                  className={`mt-1 text-xs font-semibold ${
                    hasContent ? "text-[color:var(--color-green)]" : "text-[color:var(--color-muted)]"
                  }`}
                >
                  {hasContent ? "Play →" : "—"}
                </span>
              </Link>
            );
          })}
        </div>

        <p className="text-center text-xs text-[color:var(--color-muted)]">
          For testing only — not shown to users
        </p>
      </div>
    </main>
  );
}
