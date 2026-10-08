"use client";

/** Mirrors the actual player-facing presentation (big disguised title, then hints revealed
 * one at a time) closely enough to judge a synonym title / hint without leaving the dashboard. */
export default function PreviewCard({ synonymTitle, hints }: { synonymTitle: string; hints: [string, string] }) {
  return (
    <div className="flex flex-col gap-2 p-3 rounded-xl bg-[color:var(--color-navy)] border border-[color:var(--color-border)]">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[color:var(--color-muted)]">Player sees</p>
      <p className="text-lg font-bold text-white leading-snug">{synonymTitle || <span className="text-[color:var(--color-muted)] italic">(empty)</span>}</p>
      {hints.map((h, i) => (
        <p key={i} className="text-xs px-2 py-1 rounded-lg bg-black/30 border border-[color:var(--color-purple)] text-[color:var(--color-purple)] w-fit">
          Hint {i + 1}: {h || <span className="italic text-[color:var(--color-muted)]">(empty)</span>}
        </p>
      ))}
    </div>
  );
}
