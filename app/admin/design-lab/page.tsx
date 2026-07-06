"use client";

import { useState } from "react";

const DESIGNS = [
  "Current",
  "Minimal",
  "Command",
  "Pill",
  "Focus",
  "Glass",
  "Neon",
  "Split",
  "Compact",
  "Arcade",
] as const;

type Design = (typeof DESIGNS)[number];

const MOCK_HINTS = [
  "A number appears in the title",
  '"…baby one more time…"',
  "Released in the late 90s",
];

function MockCard({ design, hintsUsed }: { design: Design; hintsUsed: number }) {
  const [guess, setGuess] = useState("");

  const title = "…Infant Once More";
  const genre = "Pop";
  const decade = "1990s";
  const genreColor = "#f472b6";

  const hints = MOCK_HINTS.slice(0, hintsUsed);

  return (
    <div className="relative w-full p-[2px] rounded-3xl" style={{ background: `linear-gradient(135deg, ${genreColor}99 0%, var(--color-purple) 40%, var(--color-coral) 70%, ${genreColor}44 100%)` }}>
      <div className="w-full bg-[color:var(--color-card)] rounded-[22px]">

        {/* Card header */}
        <div className="px-5 pt-2 pb-2 flex flex-col items-center text-center">
          <div className="flex items-center justify-center w-full mb-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full mt-3 mb-1"
              style={{ background: `${genreColor}22`, color: genreColor, border: `1px solid ${genreColor}55` }}>
              {genre} · {decade}
            </span>
          </div>
          <p className="leading-[1.15] text-[1.9rem] font-semibold pb-1" style={{ fontFamily: "var(--font-poppins)" }}>
            {title}
          </p>
        </div>

        <div className="h-px bg-[color:var(--color-border)] mx-5" />

        {/* Hints */}
        {hints.length > 0 && (
          <div className="px-5 pt-4 flex flex-col gap-1.5">
            {hints.map((hint, i) => (
              <div key={i} className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-[color:var(--color-navy)] border border-[color:var(--color-purple)] text-[color:var(--color-purple)]">
                <span className="opacity-60 text-xs">Hint {i + 1}</span>
                <span>{hint}</span>
              </div>
            ))}
          </div>
        )}

        {/* Prompt box — swapped by design */}
        <div className="flex flex-col gap-3 px-5 pt-3 pb-4">
          <PromptBox design={design} guess={guess} setGuess={setGuess} hintsUsed={hintsUsed} />
        </div>
      </div>
    </div>
  );
}

function PromptBox({ design, guess, setGuess, hintsUsed }: {
  design: Design;
  guess: string;
  setGuess: (v: string) => void;
  hintsUsed: number;
}) {
  const hintCost = hintsUsed < 3 ? [250, 250, 250][hintsUsed] : 0;
  const hintLabel = hintsUsed < 3
    ? `Hint ${hintsUsed + 1} (-${hintCost} pts)`
    : "Hint (3/3 used)";

  if (design === "Current") {
    return (
      <>
        <form onSubmit={(e) => e.preventDefault()} className="w-full">
          <div className="gradient-border w-full">
            <input
              type="text"
              autoComplete="off"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder="Name that track…"
              className="w-full bg-[color:var(--color-navy)] rounded-[11px] px-4 py-3 text-base text-white placeholder:text-[color:var(--color-muted)] outline-none"
            />
          </div>
        </form>
        <div className="flex flex-col gap-2">
          <button className="w-full py-2 rounded-xl font-bold text-sm text-white hover:opacity-90 transition-opacity" style={{ background: "var(--btn-gradient)" }}>
            Submit
          </button>
          <div className="flex gap-2">
            <button disabled={hintsUsed >= 3} className="flex-1 py-2 rounded-xl border border-[color:var(--color-border)] text-[color:var(--color-muted)] hover:text-[color:var(--color-purple)] hover:border-[color:var(--color-purple)] disabled:opacity-30 transition-colors text-sm font-semibold">
              {hintLabel}
            </button>
            <button disabled={hintsUsed < 3} className="flex-1 py-2 rounded-xl border border-white/20 text-white/60 hover:text-[color:var(--color-coral)] hover:border-[color:var(--color-coral)] disabled:opacity-50 transition-colors text-sm font-semibold">
              Reveal
            </button>
          </div>
          <button className="text-xs text-[color:var(--color-muted)] hover:text-white transition-colors text-right w-full">
            Next song →
          </button>
        </div>
      </>
    );
  }

  if (design === "Minimal") {
    return (
      <>
        <input
          type="text"
          autoComplete="off"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          placeholder="Name that track…"
          className="w-full bg-transparent border-b border-white/20 focus:border-white/60 px-1 py-2.5 text-base text-white placeholder:text-[color:var(--color-muted)] outline-none transition-colors"
        />
        <button className="w-full py-2.5 rounded-xl font-bold text-sm text-white hover:opacity-90 transition-opacity" style={{ background: "var(--btn-gradient)" }}>
          Submit
        </button>
        <div className="flex items-center justify-between text-xs text-[color:var(--color-muted)]">
          <button disabled={hintsUsed >= 3} className="hover:text-[color:var(--color-purple)] disabled:opacity-30 transition-colors">
            {hintsUsed < 3 ? `+ Hint ${hintsUsed + 1} (−${hintCost} pts)` : "No hints left"}
          </button>
          <div className="flex gap-3">
            <button disabled={hintsUsed < 3} className="hover:text-white disabled:opacity-30 transition-colors">Reveal</button>
            <button className="hover:text-white transition-colors">Skip →</button>
          </div>
        </div>
      </>
    );
  }

  if (design === "Command") {
    return (
      <>
        <form onSubmit={(e) => e.preventDefault()} className="w-full">
          <div className="flex items-center gap-0 bg-[color:var(--color-navy)] border border-white/10 rounded-xl overflow-hidden focus-within:border-white/30 transition-colors">
            <span className="pl-4 pr-2 text-[color:var(--color-purple)] font-mono text-base select-none">›</span>
            <input
              type="text"
              autoComplete="off"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder="Name that track…"
              className="flex-1 bg-transparent py-3 pr-2 text-base text-white placeholder:text-white/25 outline-none font-mono"
            />
            <button className="px-4 py-3 text-sm font-bold text-white hover:opacity-80 transition-opacity border-l border-white/10" style={{ background: "var(--btn-gradient)" }}>
              →
            </button>
          </div>
        </form>
        <div className="flex gap-2">
          <button disabled={hintsUsed >= 3} className="flex-1 py-2 rounded-lg text-xs font-mono text-[color:var(--color-purple)] border border-[color:var(--color-purple)]/40 hover:border-[color:var(--color-purple)] disabled:opacity-30 transition-colors">
            {hintsUsed < 3 ? `[hint ${hintsUsed + 1}]` : "[no hints]"}
          </button>
          <button disabled={hintsUsed < 3} className="flex-1 py-2 rounded-lg text-xs font-mono text-white/40 border border-white/10 hover:text-white/70 disabled:opacity-30 transition-colors">
            [reveal]
          </button>
          <button className="px-3 py-2 rounded-lg text-xs font-mono text-white/30 border border-white/10 hover:text-white/50 transition-colors">
            [skip]
          </button>
        </div>
      </>
    );
  }

  if (design === "Pill") {
    return (
      <>
        <form onSubmit={(e) => e.preventDefault()} className="w-full">
          <div className="flex gap-2">
            <input
              type="text"
              autoComplete="off"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder="Name that track…"
              className="flex-1 bg-[color:var(--color-navy)] border border-white/10 rounded-full px-5 py-3 text-sm text-white placeholder:text-[color:var(--color-muted)] outline-none focus:border-white/30 transition-colors"
            />
            <button className="px-6 py-3 rounded-full font-bold text-sm text-white hover:opacity-90 transition-opacity shrink-0" style={{ background: "var(--btn-gradient)" }}>
              Submit
            </button>
          </div>
        </form>
        <div className="flex gap-2 justify-center flex-wrap">
          <button disabled={hintsUsed >= 3} className="px-4 py-1.5 rounded-full text-xs font-semibold border border-[color:var(--color-purple)]/50 text-[color:var(--color-purple)] hover:bg-[color:var(--color-purple)]/10 disabled:opacity-30 transition-colors">
            {hintsUsed < 3 ? `Hint ${hintsUsed + 1} (−${hintCost} pts)` : "3/3 hints used"}
          </button>
          <button disabled={hintsUsed < 3} className="px-4 py-1.5 rounded-full text-xs font-semibold border border-white/20 text-white/50 hover:border-[color:var(--color-coral)] hover:text-[color:var(--color-coral)] disabled:opacity-30 transition-colors">
            Reveal
          </button>
          <button className="px-4 py-1.5 rounded-full text-xs font-semibold text-[color:var(--color-muted)] hover:text-white transition-colors">
            Next →
          </button>
        </div>
      </>
    );
  }

  if (design === "Focus") {
    return (
      <>
        <form onSubmit={(e) => e.preventDefault()} className="w-full">
          <div className="gradient-border w-full">
            <input
              type="text"
              autoComplete="off"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder="Name that track…"
              className="w-full bg-[color:var(--color-navy)] rounded-[11px] px-5 py-4 text-lg text-white placeholder:text-[color:var(--color-muted)] outline-none"
            />
          </div>
        </form>
        <button className="w-full py-3.5 rounded-xl font-bold text-base text-white hover:opacity-90 transition-opacity" style={{ background: "var(--btn-gradient)" }}>
          Submit Answer
        </button>
        <div className="grid grid-cols-3 gap-2">
          <button disabled={hintsUsed >= 3} className="col-span-2 py-2 rounded-lg text-sm font-medium border border-[color:var(--color-border)] text-[color:var(--color-muted)] hover:border-[color:var(--color-purple)] hover:text-[color:var(--color-purple)] disabled:opacity-30 transition-colors">
            {hintsUsed < 3 ? `Hint ${hintsUsed + 1}  ·  −${hintCost} pts` : "All hints used"}
          </button>
          <button disabled={hintsUsed < 3} className="py-2 rounded-lg text-sm font-medium border border-white/10 text-white/40 hover:border-[color:var(--color-coral)] hover:text-[color:var(--color-coral)] disabled:opacity-30 transition-colors">
            Reveal
          </button>
        </div>
        <button className="text-xs text-[color:var(--color-muted)] hover:text-white transition-colors text-right w-full">
          Next song →
        </button>
      </>
    );
  }

  if (design === "Glass") {
    return (
      <>
        <form onSubmit={(e) => e.preventDefault()} className="w-full">
          <input
            type="text"
            autoComplete="off"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder="Name that track…"
            className="w-full rounded-2xl px-5 py-3.5 text-base text-white placeholder:text-white/30 outline-none transition-all"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(12px)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
            }}
          />
        </form>
        <button
          className="w-full py-3 rounded-2xl font-bold text-sm text-white hover:opacity-90 transition-opacity"
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.18)",
            backdropFilter: "blur(12px)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
          }}
        >
          Submit
        </button>
        <div className="flex gap-2">
          <button
            disabled={hintsUsed >= 3}
            className="flex-1 py-2 rounded-xl text-xs font-semibold transition-colors disabled:opacity-25"
            style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", color: "#a78bfa" }}
          >
            {hintsUsed < 3 ? `Hint ${hintsUsed + 1}  ·  −${hintCost} pts` : "3/3 hints used"}
          </button>
          <button
            disabled={hintsUsed < 3}
            className="px-4 py-2 rounded-xl text-xs font-semibold transition-colors disabled:opacity-25"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}
          >
            Reveal
          </button>
        </div>
        <button className="text-xs text-white/30 hover:text-white/60 transition-colors text-right w-full">
          Next song →
        </button>
      </>
    );
  }

  if (design === "Neon") {
    return (
      <>
        <form onSubmit={(e) => e.preventDefault()} className="w-full">
          <div style={{ position: "relative" }}>
            <input
              type="text"
              autoComplete="off"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder="Name that track…"
              className="w-full bg-black/60 rounded-xl px-5 py-3.5 text-base text-white placeholder:text-white/20 outline-none transition-all"
              style={{
                border: "1px solid rgba(192,38,211,0.6)",
                boxShadow: "0 0 12px rgba(192,38,211,0.25), inset 0 0 12px rgba(192,38,211,0.04)",
              }}
            />
          </div>
        </form>
        <button
          className="w-full py-3 rounded-xl font-bold text-sm transition-opacity hover:opacity-90"
          style={{
            background: "var(--btn-gradient)",
            boxShadow: "0 0 20px rgba(124,58,237,0.5), 0 0 40px rgba(192,38,211,0.2)",
            color: "white",
          }}
        >
          Submit
        </button>
        <div className="flex gap-2">
          <button
            disabled={hintsUsed >= 3}
            className="flex-1 py-2 rounded-xl text-xs font-semibold disabled:opacity-20 transition-all hover:shadow-lg"
            style={{
              border: "1px solid rgba(124,58,237,0.7)",
              color: "#c084fc",
              background: "rgba(124,58,237,0.08)",
              textShadow: "0 0 8px rgba(192,38,211,0.6)",
            }}
          >
            {hintsUsed < 3 ? `Hint ${hintsUsed + 1} (−${hintCost} pts)` : "3/3 hints"}
          </button>
          <button
            disabled={hintsUsed < 3}
            className="px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-20 transition-colors"
            style={{ border: "1px solid rgba(249,115,22,0.5)", color: "#fb923c", background: "rgba(249,115,22,0.07)" }}
          >
            Reveal
          </button>
        </div>
        <button className="text-xs text-[color:var(--color-muted)] hover:text-white transition-colors text-right w-full">
          Next song →
        </button>
      </>
    );
  }

  if (design === "Split") {
    return (
      <>
        <form onSubmit={(e) => e.preventDefault()} className="w-full">
          <div className="flex gap-0 rounded-xl overflow-hidden border border-white/10 focus-within:border-white/25 transition-colors">
            <input
              type="text"
              autoComplete="off"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder="Name that track…"
              className="flex-1 bg-[color:var(--color-navy)] px-4 py-3.5 text-base text-white placeholder:text-white/25 outline-none"
            />
            <button
              className="px-5 shrink-0 font-bold text-sm text-white border-l border-white/10 hover:opacity-90 transition-opacity"
              style={{ background: "var(--btn-gradient)" }}
            >
              Submit
            </button>
          </div>
        </form>
        <div className="flex gap-2 items-center">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full transition-colors"
                style={{ background: i < hintsUsed ? "var(--color-purple)" : "rgba(255,255,255,0.15)" }}
              />
            ))}
          </div>
          <button
            disabled={hintsUsed >= 3}
            className="flex-1 py-2 rounded-lg border border-[color:var(--color-border)] text-[color:var(--color-muted)] hover:text-[color:var(--color-purple)] hover:border-[color:var(--color-purple)] disabled:opacity-30 transition-colors text-sm font-semibold"
          >
            {hintsUsed < 3 ? `Hint ${hintsUsed + 1} (−${hintCost} pts)` : "3/3 hints used"}
          </button>
          <button
            disabled={hintsUsed < 3}
            className="px-4 py-2 rounded-lg border border-white/10 text-white/40 hover:text-[color:var(--color-coral)] hover:border-[color:var(--color-coral)] disabled:opacity-30 transition-colors text-sm font-semibold"
          >
            Reveal
          </button>
        </div>
        <button className="text-xs text-[color:var(--color-muted)] hover:text-white transition-colors text-right w-full">
          Next song →
        </button>
      </>
    );
  }

  if (design === "Compact") {
    return (
      <>
        <form onSubmit={(e) => e.preventDefault()} className="w-full">
          <div className="gradient-border w-full">
            <input
              type="text"
              autoComplete="off"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder="Name that track…"
              className="w-full bg-[color:var(--color-navy)] rounded-[11px] px-4 py-2.5 text-sm text-white placeholder:text-[color:var(--color-muted)] outline-none"
            />
          </div>
        </form>
        <div className="flex gap-2">
          <button
            className="flex-1 py-2 rounded-xl font-bold text-sm text-white hover:opacity-90 transition-opacity"
            style={{ background: "var(--btn-gradient)" }}
          >
            Submit
          </button>
          <button
            disabled={hintsUsed >= 3}
            className="px-3 py-2 rounded-xl border border-[color:var(--color-border)] text-[color:var(--color-muted)] hover:text-[color:var(--color-purple)] hover:border-[color:var(--color-purple)] disabled:opacity-30 transition-colors text-xs font-semibold"
          >
            {hintsUsed < 3 ? `Hint ${hintsUsed + 1}` : "3/3"}
          </button>
          <button
            disabled={hintsUsed < 3}
            className="px-3 py-2 rounded-xl border border-white/10 text-white/40 hover:text-[color:var(--color-coral)] hover:border-[color:var(--color-coral)] disabled:opacity-30 transition-colors text-xs font-semibold"
          >
            Reveal
          </button>
          <button className="px-2 py-2 text-xs text-white/30 hover:text-white/60 transition-colors">
            →
          </button>
        </div>
      </>
    );
  }

  if (design === "Arcade") {
    const lives = 3 - hintsUsed;
    return (
      <>
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-[color:var(--color-muted)] uppercase tracking-widest">Hints remaining</span>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span key={i} style={{ fontSize: 16, opacity: i < lives ? 1 : 0.2 }}>♪</span>
            ))}
          </div>
        </div>
        <form onSubmit={(e) => e.preventDefault()} className="w-full">
          <div className="gradient-border w-full">
            <input
              type="text"
              autoComplete="off"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder="Name that track…"
              className="w-full bg-[color:var(--color-navy)] rounded-[11px] px-4 py-3 text-base text-white placeholder:text-[color:var(--color-muted)] outline-none"
            />
          </div>
        </form>
        <div className="grid grid-cols-2 gap-2">
          <button
            className="py-2.5 rounded-xl font-bold text-sm text-white hover:opacity-90 transition-opacity col-span-2"
            style={{ background: "var(--btn-gradient)" }}
          >
            Submit
          </button>
          <button
            disabled={hintsUsed >= 3}
            className="py-2 rounded-xl text-sm font-semibold disabled:opacity-25 transition-colors"
            style={{ background: "rgba(124,58,237,0.18)", border: "1px solid rgba(124,58,237,0.4)", color: "#c084fc" }}
          >
            {hintsUsed < 3 ? `♪ Hint (−${hintCost} pts)` : "No hints left"}
          </button>
          <button
            disabled={hintsUsed < 3}
            className="py-2 rounded-xl text-sm font-semibold disabled:opacity-25 transition-colors"
            style={{ background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.3)", color: "#fb923c" }}
          >
            Reveal ▸
          </button>
        </div>
        <button className="text-xs text-[color:var(--color-muted)] hover:text-white transition-colors text-right w-full">
          Skip this song →
        </button>
      </>
    );
  }

  return null;
}

export default function DesignLab() {
  const [active, setActive] = useState<Design>("Current");
  const [hintsUsed, setHintsUsed] = useState(0);

  return (
    <main className="min-h-screen px-4 py-10 flex flex-col items-center gap-8">
      <div className="w-full max-w-[560px] flex flex-col gap-6">

        <div className="text-center">
          <h1 className="text-2xl font-bold">Prompt Box Design Lab</h1>
          <p className="text-sm text-[color:var(--color-muted)] mt-1">Toggle designs, adjust hints, pick a favorite</p>
        </div>

        {/* Design switcher */}
        <div className="flex flex-wrap gap-2 justify-center">
          {DESIGNS.map((d) => (
            <button
              key={d}
              onClick={() => setActive(d)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
                active === d
                  ? "text-white border-transparent"
                  : "border-[color:var(--color-border)] text-[color:var(--color-muted)] hover:text-white hover:border-white/30"
              }`}
              style={active === d ? { background: "var(--btn-gradient)" } : {}}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Hints toggle */}
        <div className="flex items-center justify-between text-sm text-[color:var(--color-muted)]">
          <span>Hints shown: {hintsUsed}</span>
          <div className="flex gap-2">
            <button onClick={() => setHintsUsed(Math.max(0, hintsUsed - 1))} className="px-3 py-1 rounded-lg border border-[color:var(--color-border)] hover:text-white transition-colors">−</button>
            <button onClick={() => setHintsUsed(Math.min(3, hintsUsed + 1))} className="px-3 py-1 rounded-lg border border-[color:var(--color-border)] hover:text-white transition-colors">+</button>
          </div>
        </div>

        <MockCard design={active} hintsUsed={hintsUsed} />

        <p className="text-xs text-center text-[color:var(--color-muted)]">
          Tell me which design you like — I&apos;ll apply it to the real game and push to Vercel.
        </p>
      </div>
    </main>
  );
}
