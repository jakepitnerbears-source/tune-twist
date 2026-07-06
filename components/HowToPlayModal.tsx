"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
export default function HowToPlayModal({ onClose, onDontShowAgain }: { onClose: () => void; onDontShowAgain?: () => void }) {
  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Lock body scroll
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
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full sm:max-w-[560px] max-h-[90dvh] flex flex-col bg-[color:var(--color-card)] border border-[color:var(--color-border)] rounded-t-3xl sm:rounded-2xl overflow-hidden">

        {/* Sticky header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[color:var(--color-border)] shrink-0">
          <h2 className="text-lg font-bold">How to Play</h2>
          <button
            onClick={onClose}
            className="text-[color:var(--color-muted)] hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto px-6 py-6 flex flex-col gap-8">

          {/* The Idea */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold uppercase tracking-widest text-[color:var(--color-muted)]">The Idea</h3>
            <div className="bg-[color:var(--color-navy)] border border-[color:var(--color-border)] rounded-2xl p-5 flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-[color:var(--color-muted)]">You see this</p>
              <p className="text-2xl font-bold">Dazzling Illumination</p>
              <div className="border-t border-[color:var(--color-border)] pt-3 flex items-center gap-2">
                <span className="text-[color:var(--color-green)] font-bold text-sm">✓ Blinding Lights</span>
                <span className="text-xs text-[color:var(--color-muted)]">— The Weeknd</span>
              </div>
            </div>
            <p className="text-sm text-[color:var(--color-muted)]">
              Every word (or a few key ones) has been swapped for a synonym. Your job is to reverse-engineer the real title.
            </p>
          </div>

          {/* Guessing */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold uppercase tracking-widest text-[color:var(--color-muted)]">Guessing</h3>
            <div className="bg-[color:var(--color-navy)] border border-[color:var(--color-border)] rounded-2xl p-5">
              <ul className="flex flex-col gap-2 text-sm text-[color:var(--color-muted)]">
                <li>✓ &nbsp;Unlimited guesses — no penalty for wrong answers</li>
                <li>✓ &nbsp;Capitalization and punctuation are ignored</li>
                <li>✓ &nbsp;Small words like "the", "of", "a" can be skipped</li>
                <li>✓ &nbsp;Minor typos are forgiven</li>
                <li className="text-white font-medium pt-1">Hit Enter or Submit to check your guess</li>
              </ul>
            </div>
          </div>

          {/* Hints */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold uppercase tracking-widest text-[color:var(--color-muted)]">Hints</h3>
            <div className="bg-[color:var(--color-navy)] border border-[color:var(--color-border)] rounded-2xl p-5 flex flex-col gap-3">
              <p className="text-sm text-[color:var(--color-muted)]">
                Each song has 2 hints. Using them lowers your available points for that song.
              </p>
              <div className="flex flex-col gap-2">
                {[
                  { n: "1", text: `A lyric snippet from the song` },
                  { n: "2", text: `The artist name` },
                ].map((h) => (
                  <div
                    key={h.n}
                    className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-[color:var(--color-card)] border border-[color:var(--color-purple)] text-[color:var(--color-purple)]"
                  >
                    <span className="opacity-60 text-xs">Hint {h.n}</span>
                    <span>{h.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bonus Round */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold uppercase tracking-widest text-[color:var(--color-muted)]">Bonus Round</h3>
            <div className="bg-[color:var(--color-navy)] border border-[color:var(--color-border)] rounded-2xl p-5 flex flex-col gap-3">
              <p className="text-sm text-[color:var(--color-muted)]">
                After decoding the title, guess the artist (+100 pts) and release year (+100 pts). Get the year within one year and earn +50 pts. Get all three right with no hints and you earn a ★.
              </p>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <span style={{ color: "#facc15" }}>★</span>
                  <span className="text-[color:var(--color-muted)]">Perfect song: correct title + artist + year, no hints used</span>
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ color: "rgba(255,255,255,0.2)" }}>★</span>
                  <span className="text-[color:var(--color-muted)]">Max 5 stars per daily game</span>
                </div>
              </div>
            </div>
          </div>

          {/* Scoring */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold uppercase tracking-widest text-[color:var(--color-muted)]">Scoring</h3>
            <div className="bg-[color:var(--color-navy)] border border-[color:var(--color-border)] rounded-2xl p-5">
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between font-medium">
                  <span>Title — no hints</span>
                  <span className="font-bold text-[color:var(--color-green)]">800 pts</span>
                </div>
                <div className="flex justify-between text-[color:var(--color-muted)]">
                  <span>Title — after hint 1</span><span>600 pts</span>
                </div>
                <div className="flex justify-between text-[color:var(--color-muted)]">
                  <span>Title — after hint 2</span><span>400 pts</span>
                </div>
                <div className="flex justify-between text-[color:var(--color-muted)]">
                  <span>Artist bonus</span><span>+100 pts</span>
                </div>
                <div className="flex justify-between text-[color:var(--color-muted)]">
                  <span>Year bonus (exact)</span><span>+100 pts</span>
                </div>
                <div className="flex justify-between text-[color:var(--color-muted)]">
                  <span>Year bonus (within 1 year)</span><span>+50 pts</span>
                </div>
                <div className="flex justify-between text-[color:var(--color-muted)]">
                  <span>Song not solved</span><span>0 pts</span>
                </div>
                <div className="border-t border-[color:var(--color-border)] pt-2 flex justify-between font-bold">
                  <span>Max per song</span>
                  <span className="text-[color:var(--color-green)]">1,000 pts</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Max daily total</span>
                  <span className="text-[color:var(--color-green)]">5,000 pts</span>
                </div>
              </div>
            </div>
          </div>

          {/* Don't show again */}
          {onDontShowAgain && (
            <div className="flex justify-center pb-1">
              <button
                onClick={onDontShowAgain}
                className="text-xs text-[color:var(--color-muted)] hover:text-white transition-colors underline underline-offset-2"
              >
                Don&apos;t show this again
              </button>
            </div>
          )}

          {/* Bottom padding */}
          <div className="h-2" />
        </div>
      </div>
    </div>
  );
}
