"use client";

import { useEffect } from "react";
import { X, Infinity, Lightbulb, Star, Trophy } from "lucide-react";

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
      className="fixed inset-0 z-[100] flex items-center justify-center px-5"
      aria-modal="true"
      role="dialog"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Gradient border wrapper */}
      <div
        className="relative z-10 w-full max-w-[400px] p-[1px] rounded-2xl shadow-[0_8px_40px_rgba(124,58,237,0.4)]"
        style={{ background: "linear-gradient(135deg, var(--color-purple) 0%, #c026d3 50%, var(--color-green) 100%)" }}
      >
        <div className="flex flex-col bg-[color:var(--color-card)] rounded-2xl overflow-hidden px-5 pt-5 pb-5 gap-4">

          {/* Header */}
          <div className="relative flex items-center justify-center">
            <h2 className="text-lg font-bold">How to Play</h2>
            <button onClick={onClose} className="absolute right-0 text-[color:var(--color-muted)] hover:text-white transition-colors p-1" aria-label="Close">
              <X size={18} />
            </button>
          </div>

          {/* Subtitle */}
          <p className="text-sm text-center text-[color:var(--color-muted)] leading-snug">
            Every song title gets twisted with synonyms.<br />Untwist it and figure out the real song!
          </p>

          {/* Example card */}
          <div className="rounded-xl bg-[color:var(--color-navy)] border border-[color:var(--color-border)] px-5 py-4 flex flex-col items-center gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[color:var(--color-muted)]">You see this</p>
            <p className="text-xl font-bold text-white">Demolition Sphere</p>
            <span className="text-[color:var(--color-muted)] text-sm">↓</span>
            <div className="w-full border-t border-[color:var(--color-border)]" />
            <div className="w-full rounded-lg px-4 py-3 flex flex-col items-center gap-1" style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(245,158,11,0.06) 100%)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <p className="text-xl font-bold" style={{ color: "var(--color-green)" }}>Wrecking Ball</p>
              <p className="text-xs text-[color:var(--color-muted)]">Miley Cyrus</p>
            </div>
          </div>

          {/* 2x2 tiles */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: <Infinity size={22} />, label: "Unlimited guesses" },
              { icon: <Lightbulb size={22} />, label: <>2 hints <span className="text-[color:var(--color-muted)] font-normal">(cost pts)</span></> },
              { icon: <Star size={22} />, label: "+100 artist / year" },
              { icon: <Trophy size={22} />, label: "1,000 max / song" },
            ].map((tile, i) => (
              <div
                key={i}
                className="flex flex-col items-center justify-center gap-2 rounded-xl bg-[color:var(--color-navy)] border border-[color:var(--color-border)] py-4 px-3"
              >
                <span className="text-white/80">{tile.icon}</span>
                <span className="text-xs font-semibold text-center text-white leading-tight">{tile.label}</span>
              </div>
            ))}
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
  );
}
