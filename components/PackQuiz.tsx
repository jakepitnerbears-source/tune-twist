"use client";

import { useState } from "react";
import Link from "next/link";
import { seededShuffle } from "@/lib/shuffle";

export interface PackSong {
  id: string;
  synonymTitle: string;
}

type Reveal = {
  title: string;
  artist: string;
  releaseYear: string;
};

function QuizRound({ slug, songs, onFinish }: { slug: string; songs: PackSong[]; onFinish: () => void }) {
  const [index, setIndex] = useState(0);
  const [guess, setGuess] = useState("");
  const [score, setScore] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hints, setHints] = useState<string[]>([]);
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [wrongShake, setWrongShake] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const song = songs[index];
  const done = index >= songs.length;

  function nextSong() {
    setIndex((i) => i + 1);
    setGuess("");
    setHints([]);
    setHintsUsed(0);
    setReveal(null);
  }

  async function handleGuess(e: React.FormEvent) {
    e.preventDefault();
    if (!guess.trim() || submitting || reveal) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/pack-guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, songId: song.id, action: "check", guess }),
      });
      const data = await res.json();
      if (data.correct) {
        setScore((s) => s + Math.max(100 - hintsUsed * 25, 25));
        setReveal({ title: data.title, artist: data.artist, releaseYear: data.releaseYear });
      } else {
        setWrongShake(true);
        setTimeout(() => setWrongShake(false), 300);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleHint() {
    if (hintsUsed >= 2 || reveal) return;
    const res = await fetch("/api/pack-guess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, songId: song.id, action: "hint", hintIndex: hintsUsed }),
    });
    const data = await res.json();
    if (data.hint) {
      setHints((h) => [...h, data.hint]);
      setHintsUsed((n) => n + 1);
    }
  }

  async function handleGiveUp() {
    if (reveal) return;
    const res = await fetch("/api/pack-guess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, songId: song.id, action: "reveal" }),
    });
    const data = await res.json();
    setReveal({ title: data.title, artist: data.artist, releaseYear: data.releaseYear });
  }

  if (done) {
    return (
      <div className="bg-[color:var(--color-card)] border border-[color:var(--color-border)] rounded-2xl p-6 flex flex-col gap-4 items-center text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-[color:var(--color-muted)]">Quiz Complete</p>
        <p className="text-3xl font-bold text-[color:var(--color-green)]">{score} pts</p>
        <button
          onClick={onFinish}
          className="w-full py-3 rounded-xl text-sm font-bold text-center hover:opacity-90 transition-opacity"
          style={{ background: "var(--btn-gradient)", color: "white" }}
        >
          Play Again (New Songs) →
        </button>
        <Link href="/play" className="text-sm font-semibold text-[color:var(--color-green)] hover:opacity-80 transition-opacity">
          Try TuneTwist&apos;s Daily Puzzle →
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[color:var(--color-card)] border border-[color:var(--color-border)] rounded-2xl p-6 flex flex-col gap-4">
      <div className="flex justify-between text-xs text-[color:var(--color-muted)]">
        <span>Song {index + 1} of {songs.length}</span>
        <span>{score} pts</span>
      </div>

      <p className={`text-2xl font-bold ${wrongShake ? "animate-pulse" : ""}`}>{song.synonymTitle}</p>

      {hints.map((h, i) => (
        <p key={i} className="text-sm px-3 py-2 rounded-lg bg-[color:var(--color-navy)] border border-[color:var(--color-purple)] text-[color:var(--color-purple)]">
          Hint {i + 1}: {h}
        </p>
      ))}

      {reveal ? (
        <div className="flex flex-col gap-3">
          <div className="border-t border-[color:var(--color-border)] pt-3 flex items-center gap-2">
            <span className="text-[color:var(--color-green)] font-bold text-sm">✓ {reveal.title}</span>
            <span className="text-xs text-[color:var(--color-muted)]">— {reveal.artist}</span>
          </div>
          <button
            onClick={nextSong}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-center hover:opacity-90 transition-opacity"
            style={{ background: "var(--btn-gradient)", color: "white" }}
          >
            Next Song →
          </button>
        </div>
      ) : (
        <form onSubmit={handleGuess} className="flex flex-col gap-3">
          <input
            type="text"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder="Your guess..."
            autoComplete="off"
            className="w-full px-4 py-3 rounded-xl bg-[color:var(--color-navy)] border border-[color:var(--color-border)] text-white placeholder:text-[color:var(--color-muted)] focus:outline-none focus:border-[color:var(--color-purple)]"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-center hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ background: "var(--btn-gradient)", color: "white" }}
            >
              Submit
            </button>
            <button
              type="button"
              onClick={handleHint}
              disabled={hintsUsed >= 2}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-[color:var(--color-purple)] text-[color:var(--color-purple)] disabled:opacity-40"
            >
              Hint
            </button>
            <button
              type="button"
              onClick={handleGiveUp}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-[color:var(--color-muted)] hover:text-white transition-colors"
            >
              Skip
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function PackQuiz({ slug, allSongs }: { slug: string; allSongs: PackSong[] }) {
  const [seed, setSeed] = useState(0);
  const [started, setStarted] = useState(false);

  const roundSongs = seededShuffle(allSongs, seed).slice(0, 5);

  if (!started) {
    return (
      <button
        onClick={() => setStarted(true)}
        className="w-full py-3.5 rounded-xl text-sm font-bold text-center hover:opacity-90 transition-opacity"
        style={{ background: "var(--btn-gradient)", color: "white" }}
      >
        Start Quiz →
      </button>
    );
  }

  return (
    <QuizRound
      key={seed}
      slug={slug}
      songs={roundSongs}
      onFinish={() => setSeed(Date.now())}
    />
  );
}
