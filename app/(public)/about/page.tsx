import React from "react";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — TuneTwist",
  description: "TuneTwist is a free daily music word game. Every day, 5 song titles get rewritten with synonyms — your job is to decode them.",
};

export default function About() {
  return (
    <main className="relative flex flex-col items-center justify-start min-h-[calc(100svh-8rem)] px-4 pt-[88px] pb-12 overflow-x-hidden">

      {/* Scattered background notes */}
      <div className="absolute inset-0 pointer-events-none select-none" aria-hidden="true">
        {[
          { symbol: "♪", x: "8%",  y: "12%", size: 28, rot: -15 },
          { symbol: "♫", x: "88%", y: "8%",  size: 24, rot: 10  },
          { symbol: "+", x: "5%",  y: "55%", size: 26, rot: 0   },
          { symbol: "♩", x: "92%", y: "42%", size: 22, rot: 20  },
          { symbol: "♪", x: "15%", y: "82%", size: 20, rot: -8  },
          { symbol: "♫", x: "82%", y: "75%", size: 26, rot: -12 },
          { symbol: "+", x: "78%", y: "22%", size: 20, rot: 45  },
          { symbol: "♩", x: "22%", y: "30%", size: 18, rot: 5   },
          { symbol: "♪", x: "94%", y: "62%", size: 20, rot: 15  },
          { symbol: "+", x: "35%", y: "88%", size: 22, rot: 30  },
          { symbol: "♫", x: "4%",  y: "35%", size: 18, rot: -20 },
          { symbol: "♩", x: "68%", y: "90%", size: 20, rot: 8   },
        ].map((el, i) => (
          <span key={i} style={{
            position: "absolute",
            left: el.x,
            top: el.y,
            fontSize: el.size,
            transform: `rotate(${el.rot}deg)`,
            color: "rgba(255,255,255,0.28)",
            animation: `dot-float ${3.5 + (i % 4) * 0.8}s ease-in-out ${i * 0.5}s infinite`,
            fontFamily: "serif",
          }}>
            {el.symbol}
          </span>
        ))}
      </div>

      <div className="relative z-10 w-full max-w-[560px] flex flex-col gap-8">

        {/* Logo */}
        <div className="relative z-20 flex justify-center">
          <Image src="/logo.png" alt="TuneTwist" width={200} height={100} className="object-contain" />
        </div>

        {/* Hero card with glow */}
        <div className="relative w-full">
          <div className="absolute pointer-events-none" style={{ inset: "-100px", zIndex: 0 }}>
            <div style={{ position: "absolute", top: "0%", left: "-15%", width: "75%", height: "80%", background: "radial-gradient(ellipse at center, var(--blob-a-hi) 0%, var(--blob-a-lo) 45%, transparent 72%)", filter: "blur(50px)", animation: "blob-drift-a 12s ease-in-out infinite" }} />
            <div style={{ position: "absolute", bottom: "0%", right: "-12%", width: "72%", height: "78%", background: "radial-gradient(ellipse at center, var(--blob-b-hi) 0%, var(--blob-b-lo) 45%, transparent 72%)", filter: "blur(54px)", animation: "blob-drift-b 15s ease-in-out 2s infinite" }} />
            <div style={{ position: "absolute", top: "25%", right: "0%", width: "55%", height: "60%", background: "radial-gradient(ellipse at center, var(--blob-c-hi) 0%, var(--blob-c-lo) 45%, transparent 72%)", filter: "blur(46px)", animation: "blob-drift-c 18s ease-in-out 5s infinite" }} />
          </div>

          <div className="relative z-10 w-full p-[2px] rounded-3xl" style={{ background: "linear-gradient(135deg, var(--color-coral) 0%, var(--color-purple) 50%, var(--gradient-a) 100%)" }}>
            <div className="bg-[color:var(--color-card)] rounded-[22px] p-7 flex flex-col gap-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-[color:var(--color-muted)]">About TuneTwist</p>
              <h1 className="text-3xl font-bold leading-tight">A daily game for people who live and breathe music.</h1>
              <p className="text-[color:var(--color-muted)] text-sm leading-relaxed">
                Every day, 5 song titles get rewritten using synonyms. Your job is to reverse-engineer the real title — no multiple choice, no hints required. Just you and your music knowledge.
              </p>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-[color:var(--color-card)] border border-[color:var(--color-border)] rounded-2xl p-6 flex flex-col gap-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-[color:var(--color-muted)]">How It Works</p>
          <div className="flex flex-col gap-4">
            {[
              { n: "01", heading: "A new puzzle drops every day", body: "Five songs, five synonymized titles. The puzzle resets at midnight — so there's always something new to decode." },
              { n: "02", heading: "Synonyms replace key words", body: <><span className="text-white font-bold">Blinding Lights</span> becomes <span className="text-[color:var(--color-purple)] font-bold">Dazzling Illumination</span>. Same structure, totally twisted — work backwards and name that track.</> },
              { n: "03", heading: "Hints are available, but they cost you", body: "Each song has 3 escalating hints. Use them sparingly — every hint lowers the points you can earn for that song." },
              { n: "04", heading: "Earn stars for perfection", body: "Solve a song with no hints, then correctly name the artist and release year, and you'll earn a ★. Max 5 per day." },
            ].map((step) => (
              <div key={step.n} className="flex gap-4">
                <span className="text-xs font-bold text-[color:var(--color-purple)] mt-0.5 shrink-0 w-6">{step.n}</span>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold text-white">{step.heading}</p>
                  <p className="text-sm text-[color:var(--color-muted)] leading-relaxed">{step.body as React.ReactNode}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scoring snapshot */}
        <div className="bg-[color:var(--color-card)] border border-[color:var(--color-border)] rounded-2xl p-6 flex flex-col gap-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[color:var(--color-muted)]">Scoring</p>
          <div className="flex flex-col gap-2 text-sm">
            {[
              { label: "No hints used", pts: "1,000 pts", highlight: true },
              { label: "Correct after hint 1", pts: "750 pts", highlight: false },
              { label: "Correct after hint 2", pts: "500 pts", highlight: false },
              { label: "Correct after hint 3", pts: "250 pts", highlight: false },
            ].map((row) => (
              <div key={row.label} className="flex justify-between">
                <span className={row.highlight ? "font-medium text-white" : "text-[color:var(--color-muted)]"}>{row.label}</span>
                <span className={row.highlight ? "font-bold text-[color:var(--color-green)]" : "text-[color:var(--color-muted)]"}>{row.pts}</span>
              </div>
            ))}
            <div className="border-t border-[color:var(--color-border)] pt-2 flex justify-between font-bold">
              <span>Max daily total</span>
              <span className="text-[color:var(--color-green)]">5,000 pts</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <Link
          href="/play"
          className="w-full py-3.5 rounded-xl text-sm font-bold text-center hover:opacity-90 transition-opacity"
          style={{ background: "var(--btn-gradient)", color: "white" }}
        >
          Play Today's Puzzle →
        </Link>

      </div>
    </main>
  );
}
