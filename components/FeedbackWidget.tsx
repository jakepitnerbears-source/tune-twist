"use client";

import { useState } from "react";

const REACTIONS = [
  { emoji: "🔥", label: "Fire" },
  { emoji: "😄", label: "Fun" },
  { emoji: "😐", label: "Meh" },
  { emoji: "😤", label: "Too Hard" },
];

export default function FeedbackWidget() {
  const [selected, setSelected] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function pick(label: string) {
    setSelected(label);
    try {
      await fetch("https://formspree.io/f/xeebvglo", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ reaction: label, _subject: "TuneTwist puzzle reaction" }),
      });
    } catch {}
    setDone(true);
  }

  if (done) {
    return (
      <div className="bg-[color:var(--color-card)] border border-[color:var(--color-border)] rounded-2xl px-6 py-5 text-center">
        <p className="text-sm text-[color:var(--color-muted)]">Thanks for the feedback! {selected}</p>
      </div>
    );
  }

  return (
    <div className="bg-[color:var(--color-card)] border border-[color:var(--color-border)] rounded-2xl px-6 py-5 flex flex-col gap-3">
      <p className="text-xs uppercase tracking-widest text-[color:var(--color-muted)] text-center">
        What did you think of today's puzzle?
      </p>
      <div className="flex justify-center gap-3">
        {REACTIONS.map((r) => (
          <button
            key={r.label}
            type="button"
            disabled={!!selected}
            onClick={() => pick(r.emoji + " " + r.label)}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl border border-[color:var(--color-border)] hover:border-[color:var(--color-purple)]/50 transition-colors text-2xl disabled:opacity-50"
          >
            {r.emoji}
            <span className="text-[10px] text-[color:var(--color-muted)]">{r.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
