"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

export default function HowToPlayModal({ onClose, onDontShowAgain }: { onClose: () => void; onDontShowAgain?: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Gradient border wrapper */}
      <div
        className="relative z-10 w-full sm:max-w-[480px] p-[1px] rounded-t-3xl sm:rounded-2xl shadow-[0_8px_40px_rgba(124,58,237,0.4)]"
        style={{ background: "linear-gradient(135deg, var(--color-purple) 0%, #c026d3 50%, var(--color-green) 100%)" }}
      >
        {/* Panel */}
        <div className="flex flex-col bg-[color:var(--color-card)] rounded-t-3xl sm:rounded-2xl overflow-hidden">

          {/* Header with gradient glow */}
          <div
            className="flex items-center justify-between px-5 py-4 shrink-0"
            style={{ background: "linear-gradient(180deg, rgba(124,58,237,0.18) 0%, transparent 100%)" }}
          >
            <h2 className="text-base font-bold tracking-tight">How to Play</h2>
            <button onClick={onClose} className="text-[color:var(--color-muted)] hover:text-white transition-colors" aria-label="Close">
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="px-5 pb-5 flex flex-col gap-4">

            {/* Example */}
            <div
              className="rounded-xl p-4 flex flex-col gap-2"
              style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(192,38,211,0.08) 100%)", border: "1px solid rgba(124,58,237,0.25)" }}
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-[color:var(--color-muted)]">You see this</p>
              <p className="text-xl font-bold">Dazzling Illumination</p>
              <div className="flex items-center gap-2 pt-1 border-t border-white/10">
                <span className="text-sm font-bold" style={{ color: "var(--color-green)" }}>✓ Blinding Lights</span>
                <span className="text-xs text-[color:var(--color-muted)]">— The Weeknd</span>
              </div>
            </div>

            {/* Quick rules */}
            <ul className="flex flex-col gap-2.5 text-sm text-[color:var(--color-muted)]">
              <li className="flex gap-2.5">
                <span style={{ color: "var(--color-purple)" }}>♪</span>
                <span>Every word is synonym-swapped — reverse-engineer the real title</span>
              </li>
              <li className="flex gap-2.5">
                <span style={{ color: "var(--color-purple)" }}>✓</span>
                <span>Unlimited guesses — typos &amp; small words like "the" are forgiven</span>
              </li>
              <li className="flex gap-2.5">
                <span style={{ color: "var(--color-purple)" }}>💡</span>
                <span>2 hints per song (lyric snippet, then artist) — each one costs points</span>
              </li>
              <li className="flex gap-2.5">
                <span style={{ color: "var(--color-green)" }}>★</span>
                <span>Bonus: guess the artist <span className="text-white font-medium">+100</span> and year <span className="text-white font-medium">+100</span> (within 1 yr: <span className="text-white font-medium">+50</span>)</span>
              </li>
            </ul>

            {/* Score pill */}
            <div className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <span className="text-[color:var(--color-muted)]">Max per song</span>
              <span style={{ color: "var(--color-green)" }} className="font-bold">1,000 pts</span>
              <span className="text-[color:var(--color-muted)]">Daily max</span>
              <span style={{ color: "var(--color-green)" }} className="font-bold">5,000 pts</span>
            </div>

            {/* Don't show again */}
            {onDontShowAgain && (
              <div className="flex justify-center pt-1">
                <button
                  onClick={onDontShowAgain}
                  className="text-xs text-[color:var(--color-muted)] hover:text-white transition-colors underline underline-offset-2"
                >
                  Don&apos;t show this again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
