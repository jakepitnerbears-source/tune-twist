import Link from "next/link";

const EPOCH = new Date("2026-04-13T12:00:00Z");

function addDays(base: Date, n: number): Date {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + n);
  return d;
}

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export const revalidate = 3600;

export default function ArchivePage() {
  const today = new Date().toISOString().split("T")[0];
  const todayDate = new Date(today + "T12:00:00Z");
  const diffDays = Math.floor((todayDate.getTime() - EPOCH.getTime()) / 86_400_000);

  const allDates = Array.from({ length: diffDays + 1 }, (_, i) => toDateStr(addDays(EPOCH, i)));
  const pastDates = [...allDates].reverse();
  const futureDates: string[] = [];

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
                <div key={date} className="p-[1px] rounded-2xl" style={{ background: "linear-gradient(135deg, #7b61ff 0%, #c850c0 45%, #ff6b3d 100%)" }}>
                  <Link
                    href={`/play/${date}`}
                    className="flex flex-col gap-1 p-4 rounded-[14px] bg-[color:var(--color-card)] transition-opacity hover:opacity-80 block"
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
                </div>
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
                <div key={date} className="p-[1px] rounded-2xl opacity-60 hover:opacity-100 transition-opacity" style={{ background: "linear-gradient(135deg, #7b61ff 0%, #c850c0 45%, #ff6b3d 100%)" }}>
                  <Link
                    href={`/play/${date}`}
                    className="flex flex-col gap-1 p-4 rounded-[14px] bg-[color:var(--color-card)] block"
                  >
                    <span className="text-sm font-bold text-white">{formatDate(date)}</span>
                    <span className="text-xs text-[color:var(--color-muted)]">5 songs</span>
                    <span className="mt-1 text-xs font-semibold text-[color:var(--color-purple)]">
                      Preview →
                    </span>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
