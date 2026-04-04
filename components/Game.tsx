"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { DailyPuzzle } from "@/lib/getDailyPuzzle";
import { validateGuess, isAlmostCorrect } from "@/lib/validateGuess";
import { Difficulty } from "@/data/puzzles";
import { fetchSongInfo, SongInfo } from "@/lib/fetchSongInfo";
import SongReveal from "@/components/SongReveal";
import StarRating from "@/components/StarRating";

const HINT_COSTS = [200, 300, 400];
const BASE_SCORE = 1000;
const ARTIST_BONUS = 150;
const YEAR_BONUS = 100;
const MAX_SONG_SCORE = BASE_SCORE + ARTIST_BONUS + YEAR_BONUS; // 1250

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: "bg-[color:var(--color-green)] text-[color:var(--color-navy)]",
  medium: "bg-yellow-400 text-[color:var(--color-navy)]",
  hard: "bg-[color:var(--color-coral)] text-white",
  viral: "bg-[color:var(--color-purple)] text-white",
};

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  viral: "Viral",
};

const CORRECT_MESSAGES = [
  "Nice. That was quick.",
  "You got that 👀",
  "Clean solve.",
  "That one trips people up.",
  "Locked in.",
];
const WRONG_MESSAGES = ["Not quite…", "Try again.", "Hmm, no."];
const ALMOST_MESSAGES = ["You're very close 👀", "So close. One more try.", "Getting warm…"];
const HINT_MESSAGES = ["Here's a nudge.", "Getting warmer.", "Almost there…"];
const SKIP_MESSAGES = ["No points for this one.", "Revealed."];

function randomFrom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

const NUMBER_ONES: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11,
  twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
};
const NUMBER_TENS: Record<string, number> = {
  twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};

// Converts "Twenty One" → "21", "Five" → "5", "30" stays "30", etc.
function collapseNumbers(str: string): string {
  let s = str.toLowerCase().replace(/-/g, " ");
  // Compound: "twenty one" → "21"
  s = s.replace(
    /\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)\s+(one|two|three|four|five|six|seven|eight|nine)\b/g,
    (_, tens, ones) => String(NUMBER_TENS[tens] + NUMBER_ONES[ones])
  );
  // Remaining tens: "twenty" → "20"
  s = s.replace(
    /\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)\b/g,
    (_, tens) => String(NUMBER_TENS[tens])
  );
  // Ones / teens: "one" → "1", "nineteen" → "19"
  s = s.replace(
    /\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen)\b/g,
    (_, ones) => String(NUMBER_ONES[ones])
  );
  return s;
}

function normalizeArtist(str: string): string {
  return collapseNumbers(str).replace(/[^a-z0-9\s]/g, "").trim();
}

function validateArtist(guess: string, correct: string): boolean {
  const g = normalizeArtist(guess);
  const c = normalizeArtist(correct);
  if (g === c) return true;
  if (c.includes(g) || g.includes(c)) return true;
  return false;
}

function validateYear(guess: string, correct: string): boolean {
  const g = parseInt(guess.trim(), 10);
  const c = parseInt(correct, 10);
  return !isNaN(g) && Math.abs(g - c) <= 1;
}

function titleScore(hintsUsed: number, solved: boolean): number {
  if (!solved) return 0;
  const deduction = HINT_COSTS.slice(0, hintsUsed).reduce((a, b) => a + b, 0);
  return Math.max(100, BASE_SCORE - deduction);
}

function totalSongScore(s: SongState): number {
  return (
    titleScore(s.hintsUsed, s.solved) +
    (s.artistCorrect ? ARTIST_BONUS : 0) +
    (s.yearCorrect ? YEAR_BONUS : 0)
  );
}

function starRating(score: number, maxScore: number): number {
  const pct = score / maxScore;
  if (pct >= 0.9) return 5;
  if (pct >= 0.7) return 4;
  if (pct >= 0.5) return 3;
  if (pct >= 0.2) return 2;
  if (pct > 0) return 1;
  return 0;
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

function formatCountdown(): string {
  const now = new Date();
  const nextMidnight = new Date();
  nextMidnight.setUTCHours(24, 0, 0, 0);
  const diff = nextMidnight.getTime() - now.getTime();
  if (diff <= 0) return "00:00:00";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

const CONFETTI_PARTICLES = [
  { idx: 0, color: "#a8ff3e", delay: 0 },
  { idx: 1, color: "#7b61ff", delay: 30 },
  { idx: 2, color: "#a8ff3e", delay: 60 },
  { idx: 3, color: "#ff6b3d", delay: 20 },
  { idx: 4, color: "#7b61ff", delay: 50 },
  { idx: 5, color: "#a8ff3e", delay: 40 },
  { idx: 6, color: "#ff6b3d", delay: 10 },
  { idx: 7, color: "#7b61ff", delay: 70 },
  { idx: 8, color: "#a8ff3e", delay: 15 },
  { idx: 9, color: "#ff6b3d", delay: 55 },
];

interface SongState {
  hintsUsed: number;
  solved: boolean;
  skipped: boolean;
  guess: string;
  feedback: string;
  feedbackWarm: boolean;
  shake: boolean;
  glow: boolean;
  songInfo: SongInfo | null | "loading";
  bonusDone: boolean;
  artistGuess: string;
  artistCorrect: boolean | null;
  artistFeedback: string;
  yearGuess: string;
  yearCorrect: boolean | null;
  yearFeedback: string;
}

function initialSongState(): SongState {
  return {
    hintsUsed: 0,
    solved: false,
    skipped: false,
    guess: "",
    feedback: "",
    feedbackWarm: false,
    shake: false,
    glow: false,
    songInfo: null,
    bonusDone: false,
    artistGuess: "",
    artistCorrect: null,
    artistFeedback: "",
    yearGuess: "",
    yearCorrect: null,
    yearFeedback: "",
  };
}

function Countdown() {
  const [time, setTime] = useState(formatCountdown());
  useEffect(() => {
    const id = setInterval(() => setTime(formatCountdown()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="text-center flex flex-col gap-1">
      <p className="text-xs text-[color:var(--color-muted)] uppercase tracking-widest">
        Next puzzle in
      </p>
      <p className="text-xl font-bold tabular-nums">{time}</p>
    </div>
  );
}

export default function Game({ puzzle, puzzleNumber, genreLabel }: { puzzle: DailyPuzzle; puzzleNumber?: number; genreLabel?: string }) {
  const [songIndex, setSongIndex] = useState(0);
  const [states, setStates] = useState<SongState[]>(puzzle.map(initialSongState));
  const [gameOver, setGameOver] = useState(false);
  const [streak, setStreak] = useState(0);
  const [copied, setCopied] = useState(false);
  const [fullConfetti, setFullConfetti] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const artistRef = useRef<HTMLInputElement>(null);
  const streakRef = useRef(0);

  const current = puzzle[songIndex];
  const state = states[songIndex];

  // Load streak from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("tunedecode_streak");
      if (stored) {
        const data = JSON.parse(stored) as { lastPlayed: string; streak: number };
        if (data.lastPlayed === getToday() || data.lastPlayed === getYesterday()) {
          streakRef.current = data.streak;
          setStreak(data.streak);
        }
      }
    } catch {}
  }, []);

  // Save streak when game ends
  useEffect(() => {
    if (!gameOver) return;
    const solved = states.filter((s) => s.solved).length;
    const newStreak = solved >= 3 ? streakRef.current + 1 : 0;
    streakRef.current = newStreak;
    setStreak(newStreak);
    try {
      localStorage.setItem(
        "tunedecode_streak",
        JSON.stringify({ lastPlayed: getToday(), streak: newStreak })
      );
    } catch {}
  }, [gameOver]); // eslint-disable-line react-hooks/exhaustive-deps

  // Full-screen confetti when title + artist + year all correct
  useEffect(() => {
    const s = states[songIndex];
    if (s.solved && s.artistCorrect === true && s.yearCorrect === true) {
      setFullConfetti(true);
      const t = setTimeout(() => setFullConfetti(false), 3000);
      return () => clearTimeout(t);
    }
  }, [songIndex, states[songIndex]?.artistCorrect, states[songIndex]?.yearCorrect]); // eslint-disable-line react-hooks/exhaustive-deps

  const confettiPieces = useMemo(() => {
    if (!fullConfetti) return [];
    const colors = ["#a8ff3e", "#7b61ff", "#ff6b3d", "#ffffff", "#ffd700"];
    return Array.from({ length: 80 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 6 + Math.random() * 7,
      round: Math.random() > 0.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      duration: 1.8 + Math.random() * 1.8,
      delay: Math.random() * 1.0,
    }));
  }, [fullConfetti]);

  // Focus management
  useEffect(() => {
    if (!state.solved && !state.skipped) inputRef.current?.focus();
  }, [songIndex, state.solved, state.skipped]);

  useEffect(() => {
    if (state.solved && !state.bonusDone && state.artistCorrect === null) {
      artistRef.current?.focus();
    }
  }, [state.solved, state.bonusDone, state.artistCorrect]);

  function updateState(index: number, patch: Partial<SongState>) {
    setStates((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  async function handleSubmit() {
    if (!state.guess.trim() || state.solved) return;
    const correct = validateGuess(state.guess, current.title);
    if (correct) {
      // If all 3 hints were used, hint[2] revealed the artist — skip artist bonus
      const autoSkipArtist = state.hintsUsed >= 3;
      updateState(songIndex, {
        solved: true,
        feedback: randomFrom(CORRECT_MESSAGES),
        songInfo: "loading",
        glow: true,
        shake: false,
        ...(autoSkipArtist ? { artistCorrect: false } : {}),
      });
      setTimeout(() => updateState(songIndex, { glow: false }), 1000);
      const info = await fetchSongInfo(current.title, current.artist);
      updateState(songIndex, { songInfo: info });
    } else {
      const almost = isAlmostCorrect(state.guess, current.title);
      updateState(songIndex, {
        feedback: almost ? randomFrom(ALMOST_MESSAGES) : randomFrom(WRONG_MESSAGES),
        feedbackWarm: almost,
        shake: true,
      });
      setTimeout(() => updateState(songIndex, { shake: false }), 500);
    }
  }

  function handleArtistSubmit() {
    if (!state.artistGuess.trim() || state.artistCorrect !== null) return;
    const correct = validateArtist(state.artistGuess, current.artist);
    updateState(songIndex, {
      artistCorrect: correct,
      artistFeedback: correct
        ? randomFrom(["+150. You know your stuff.", "Artist locked in."])
        : randomFrom(["Not quite. Try again.", "Close?"]),
    });
  }

  function handleYearSubmit() {
    if (!state.yearGuess.trim() || state.yearCorrect !== null) return;
    const releaseYear =
      state.songInfo && state.songInfo !== "loading"
        ? state.songInfo.releaseYear
        : current.releaseYear ?? "";
    const correct = validateYear(state.yearGuess, releaseYear);
    updateState(songIndex, {
      yearCorrect: correct,
      yearFeedback: correct
        ? randomFrom(["+100. Dialed in.", "Year on point."])
        : randomFrom(["Wrong year. Guess again.", "Off by more than one."]),
    });
  }

  function handleSkipBonus() {
    updateState(songIndex, {
      bonusDone: true,
      artistCorrect: state.artistCorrect ?? false,
      yearCorrect: state.yearCorrect ?? false,
    });
  }

  function handleHint() {
    if (state.hintsUsed >= current.hints.length || state.solved) return;
    updateState(songIndex, {
      hintsUsed: state.hintsUsed + 1,
      feedback: randomFrom(HINT_MESSAGES),
      feedbackWarm: false,
    });
  }

  function handleReveal() {
    if (state.hintsUsed < current.hints.length) return;
    updateState(songIndex, { skipped: true, feedback: randomFrom(SKIP_MESSAGES) });
  }

  function handleNext() {
    if (songIndex < puzzle.length - 1) {
      setSongIndex(songIndex + 1);
    } else {
      setGameOver(true);
    }
  }

  function buildShareText(score: number): string {
    const solvedCount = states.filter((s) => s.solved).length;
    const stars = starRating(score, maxScore);
    const starEmojis = "⭐".repeat(stars) + "☆".repeat(5 - stars);
    const emojis = states
      .map((s) => (!s.solved ? "⬜" : s.hintsUsed === 0 ? "🟩" : "🟨"))
      .join(" ");
    const label = genreLabel ? genreLabel : `#${puzzleNumber}`;
    return `TuneTwist ${label}  ${solvedCount}/${puzzle.length}\n${starEmojis}\n\n${emojis}\n\ntunetwist.com`;
  }

  function handleCopyResults(score: number) {
    navigator.clipboard.writeText(buildShareText(score)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const bonusComplete =
    state.bonusDone ||
    (state.artistCorrect !== null && state.yearCorrect !== null);

  const totalScore = states.reduce((sum, s) => sum + totalSongScore(s), 0);
  const maxScore = puzzle.length * MAX_SONG_SCORE;

  // ── Results screen ────────────────────────────────────────────────────────
  if (gameOver) {
    const stars = starRating(totalScore, maxScore);
    const solvedCount = states.filter((s) => s.solved).length;
    return (
      <main className="flex flex-col items-center justify-center min-h-[calc(100svh-8rem)] px-4 py-6">
        <div className="w-full max-w-[560px] flex flex-col gap-6">

          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight">TuneTwist</h1>
            {streak > 0 && (
              <p className="text-sm text-[color:var(--color-muted)] mt-1">
                🔥 {streak}-day streak
              </p>
            )}
          </div>

          {/* Share preview */}
          <div className="bg-[color:var(--color-card)] border border-[color:var(--color-border)] rounded-2xl px-6 py-5">
            <p className="text-[color:var(--color-muted)] text-xs uppercase tracking-widest text-center mb-3">Share Preview</p>
            <pre className="text-sm text-center whitespace-pre font-mono leading-relaxed">
              {buildShareText(totalScore)}
            </pre>
          </div>

          {/* Copy Results CTA */}
          <button
            onClick={() => handleCopyResults(totalScore)}
            className="w-full py-3.5 rounded-xl bg-[color:var(--color-green)] text-[color:var(--color-navy)] text-sm font-bold hover:opacity-90 transition-opacity"
          >
            {copied ? "Copied! ✓" : "Copy Results"}
          </button>

          <div className="bg-[color:var(--color-card)] border border-[color:var(--color-border)] rounded-2xl p-8 flex flex-col gap-5">
            <p className="text-[color:var(--color-muted)] text-xs uppercase tracking-widest text-center">
              {genreLabel ? genreLabel : `Today's Results — #${puzzleNumber}`}
            </p>
            <div className="flex justify-center">
              <StarRating stars={stars} size={28} />
            </div>
            <p className="text-3xl font-bold text-center">{totalScore.toLocaleString()} pts</p>
            <p className="text-[color:var(--color-muted)] text-sm text-center">
              {solvedCount} of {puzzle.length} songs decoded
            </p>

            {/* Emoji grid */}
            <div className="text-center text-2xl tracking-widest">
              {states.map((s, i) => (
                <span key={i}>
                  {!s.solved ? "⬜" : s.hintsUsed === 0 ? "🟩" : "🟨"}
                </span>
              ))}
            </div>

            {/* Song breakdown */}
            <div className="flex flex-col gap-3 mt-1">
              {puzzle.map((song, i) => {
                const s = states[i];
                return (
                  <div key={song.id} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span
                        className={
                          s.solved
                            ? "text-white font-semibold"
                            : "text-[color:var(--color-muted)] line-through"
                        }
                      >
                        {song.title}
                      </span>
                      <span
                        className={`font-semibold ${
                          s.solved
                            ? "text-[color:var(--color-green)]"
                            : "text-[color:var(--color-muted)]"
                        }`}
                      >
                        {totalSongScore(s)} pts
                      </span>
                    </div>
                    {s.solved && (
                      <div className="flex gap-2 text-xs">
                        <span
                          className={
                            s.artistCorrect
                              ? "text-[color:var(--color-green)]"
                              : "text-[color:var(--color-red)]"
                          }
                        >
                          {s.artistCorrect ? "✓ Artist" : "✗ Artist"}
                        </span>
                        <span
                          className={
                            s.yearCorrect
                              ? "text-[color:var(--color-green)]"
                              : "text-[color:var(--color-red)]"
                          }
                        >
                          {s.yearCorrect ? "✓ Year" : "✗ Year"}
                        </span>
                      </div>
                    )}
                    {s.solved && s.songInfo && s.songInfo !== "loading" && (
                      <SongReveal info={s.songInfo as SongInfo} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <Countdown />

        </div>
      </main>
    );
  }

  // ── Game screen ───────────────────────────────────────────────────────────
  return (
    <main className="flex flex-col items-center justify-center min-h-[calc(100svh-8rem)] px-4 py-6">
      <div className="w-full max-w-[560px] flex flex-col gap-8">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">TuneTwist</h1>
          <p className="text-[color:var(--color-muted)] text-sm mt-1">
            Twist the song. One synonym at a time.
          </p>
        </div>

        {/* Progress tracker */}
        <div className="flex gap-2 items-center justify-center flex-wrap">
          {puzzle.map((song, i) => {
            const s = states[i];
            const isActive = i === songIndex;
            const artwork =
              s.songInfo && s.songInfo !== "loading"
                ? (s.songInfo as SongInfo).artworkUrl
                : null;

            if (s.solved) {
              return (
                <button
                  key={i}
                  onClick={() => setSongIndex(i)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
                    isActive
                      ? "border-[color:var(--color-green)] bg-[color:var(--color-card)]"
                      : "border-[color:var(--color-border)] bg-[color:var(--color-card)] opacity-70 hover:opacity-100"
                  }`}
                >
                  {artwork ? (
                    <img
                      src={artwork}
                      alt={song.title}
                      className="w-5 h-5 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-[color:var(--color-green)] opacity-50 shrink-0" />
                  )}
                  <span className="text-xs font-semibold text-white truncate max-w-[100px]">
                    {song.title}
                  </span>
                </button>
              );
            }

            return (
              <button
                key={i}
                onClick={() => setSongIndex(i)}
                className={`h-2 rounded-full transition-all ${
                  isActive
                    ? "w-6 bg-[color:var(--color-green)]"
                    : s.skipped
                    ? "w-2 bg-[color:var(--color-muted)]"
                    : "w-2 bg-[color:var(--color-border)]"
                }`}
              />
            );
          })}
        </div>

        {/* Song card */}
        <div
          className={`relative bg-[color:var(--color-card)] border border-[color:var(--color-border)] rounded-2xl p-6 flex flex-col gap-4 ${
            state.shake ? "animate-shake" : ""
          } ${state.glow ? "animate-glow" : ""}`}
        >
          {/* Confetti burst */}
          {state.glow && (
            <div
              className="absolute top-1/3 left-1/2 pointer-events-none"
              aria-hidden="true"
            >
              {CONFETTI_PARTICLES.map((p) => (
                <span
                  key={p.idx}
                  style={{
                    position: "absolute",
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: p.color,
                    animation: `confetti-${p.idx} 0.75s ease-out ${p.delay}ms forwards`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Card header */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-widest text-[color:var(--color-muted)]">
              Song {songIndex + 1} of {puzzle.length}
            </span>
            {state.solved || state.skipped ? (
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${DIFFICULTY_COLORS[current.difficulty]}`}
              >
                {DIFFICULTY_LABELS[current.difficulty]}
              </span>
            ) : (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-[color:var(--color-border)] text-[color:var(--color-muted)]">
                ?
              </span>
            )}
          </div>

          {/* Synonym title */}
          <p className="text-2xl font-bold leading-snug">{current.synonymTitle}</p>

          {/* Hints */}
          {state.hintsUsed > 0 && (
            <div className="flex flex-col gap-1.5">
              {current.hints.slice(0, state.hintsUsed).map((hint, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-[color:var(--color-navy)] border border-[color:var(--color-purple)] text-[color:var(--color-purple)]"
                >
                  <span className="opacity-60 text-xs">Hint {i + 1}</span>
                  <span>{hint}</span>
                </div>
              ))}
            </div>
          )}

          {/* Solved state */}
          {state.solved ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-[color:var(--color-green)] font-bold text-sm">
                  ✓ {current.title}
                </span>
                <span className="text-xs text-[color:var(--color-muted)]">
                  +{titleScore(state.hintsUsed, true)} pts
                </span>
              </div>
              <p className="text-[color:var(--color-muted)] text-sm -mt-2">{state.feedback}</p>

              {/* Bonus round */}
              {!bonusComplete ? (
                <div className="flex flex-col gap-3 border-t border-[color:var(--color-border)] pt-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[color:var(--color-muted)]">
                    Bonus Round — up to +{state.hintsUsed >= 3 ? YEAR_BONUS : ARTIST_BONUS + YEAR_BONUS} pts
                  </p>

                  {/* Artist — hidden if hint 3 (artist) was already used */}
                  {state.hintsUsed < 3 && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-[color:var(--color-muted)]">
                        Who's the artist?
                      </label>

                      {/* Input state */}
                      {state.artistCorrect === null ? (
                        <div className="flex gap-2">
                          <input
                            ref={artistRef}
                            type="text"
                            value={state.artistGuess}
                            onChange={(e) =>
                              updateState(songIndex, {
                                artistGuess: e.target.value,
                                artistFeedback: "",
                              })
                            }
                            onKeyDown={(e) => e.key === "Enter" && handleArtistSubmit()}
                            placeholder=""
                            className="flex-1 bg-[color:var(--color-navy)] border border-[color:var(--color-border)] rounded-xl px-3 py-2 text-sm text-white placeholder:text-[color:var(--color-muted)] outline-none focus:border-[color:var(--color-green)] transition-colors"
                          />
                          <button
                            onClick={handleArtistSubmit}
                            className="px-4 py-2 rounded-xl bg-[color:var(--color-green)] text-[color:var(--color-navy)] text-sm font-bold hover:opacity-90 transition-opacity"
                          >
                            +{ARTIST_BONUS}
                          </button>
                        </div>
                      ) : (
                        /* Result state */
                        <div
                          className={`flex items-center justify-between px-3 py-2 rounded-xl border ${
                            state.artistCorrect
                              ? "border-[color:var(--color-green)] bg-[color:var(--color-green)]/10"
                              : "border-[color:var(--color-red)] bg-[color:var(--color-red)]/10"
                          }`}
                        >
                          <span className="text-sm text-white">
                            {state.artistCorrect ? state.artistGuess : current.artist}
                          </span>
                          <span
                            className={`text-sm font-bold ${
                              state.artistCorrect
                                ? "text-[color:var(--color-green)]"
                                : "text-[color:var(--color-red)]"
                            }`}
                          >
                            {state.artistCorrect ? `+${ARTIST_BONUS}` : "✗"}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Year */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-[color:var(--color-muted)]">
                      What year was it released?
                    </label>

                    {/* Input state */}
                    {state.yearCorrect === null ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={state.yearGuess}
                          onChange={(e) =>
                            updateState(songIndex, {
                              yearGuess: e.target.value,
                              yearFeedback: "",
                            })
                          }
                          onKeyDown={(e) => e.key === "Enter" && handleYearSubmit()}
                          placeholder=""
                          className="flex-1 bg-[color:var(--color-navy)] border border-[color:var(--color-border)] rounded-xl px-3 py-2 text-sm text-white placeholder:text-[color:var(--color-muted)] outline-none focus:border-[color:var(--color-green)] transition-colors"
                        />
                        <button
                          onClick={handleYearSubmit}
                          className="px-4 py-2 rounded-xl bg-[color:var(--color-green)] text-[color:var(--color-navy)] text-sm font-bold hover:opacity-90 transition-opacity"
                        >
                          +{YEAR_BONUS}
                        </button>
                      </div>
                    ) : (
                      /* Result state */
                      <div
                        className={`flex items-center justify-between px-3 py-2 rounded-xl border ${
                          state.yearCorrect
                            ? "border-[color:var(--color-green)] bg-[color:var(--color-green)]/10"
                            : "border-[color:var(--color-red)] bg-[color:var(--color-red)]/10"
                        }`}
                      >
                        <span className="text-sm text-white">
                          {state.yearCorrect
                            ? state.yearGuess
                            : `${state.yearGuess} — answer: ${
                                state.songInfo && state.songInfo !== "loading"
                                  ? state.songInfo.releaseYear
                                  : current.releaseYear ?? "?"
                              }`}
                        </span>
                        <span
                          className={`text-sm font-bold ${
                            state.yearCorrect
                              ? "text-[color:var(--color-green)]"
                              : "text-[color:var(--color-red)]"
                          }`}
                        >
                          {state.yearCorrect ? `+${YEAR_BONUS}` : "✗"}
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleSkipBonus}
                    className="text-xs text-[color:var(--color-muted)] hover:text-white transition-colors text-left"
                  >
                    Skip bonus →
                  </button>
                </div>
              ) : (
                /* Bonus complete */
                <div className="flex flex-col gap-3 border-t border-[color:var(--color-border)] pt-4">
                  <div className="flex gap-3 text-sm">
                    <span
                      className={
                        state.artistCorrect
                          ? "text-[color:var(--color-green)]"
                          : "text-[color:var(--color-muted)]"
                      }
                    >
                      {state.artistCorrect
                        ? `✓ Artist +${ARTIST_BONUS}`
                        : `✗ Artist (${current.artist})`}
                    </span>
                    <span
                      className={
                        state.yearCorrect
                          ? "text-[color:var(--color-green)]"
                          : "text-[color:var(--color-muted)]"
                      }
                    >
                      {state.yearCorrect
                        ? `✓ Year +${YEAR_BONUS}`
                        : `✗ Year (${
                            state.songInfo && state.songInfo !== "loading"
                              ? state.songInfo.releaseYear
                              : current.releaseYear ?? ""
                          })`}
                    </span>
                  </div>
                  <SongReveal info={state.songInfo} />
                </div>
              )}
            </div>
          ) : state.skipped ? (
            <div className="flex flex-col gap-1">
              <p className="text-xs text-[color:var(--color-coral)] font-medium">
                {state.feedback}
              </p>
              <p className="text-sm text-[color:var(--color-muted)]">
                {current.title} — {current.artist}
              </p>
            </div>
          ) : (
            <>
              <input
                ref={inputRef}
                type="text"
                value={state.guess}
                onChange={(e) =>
                  updateState(songIndex, { guess: e.target.value, feedback: "" })
                }
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="Type your guess…"
                className="w-full bg-[color:var(--color-navy)] border border-[color:var(--color-border)] rounded-xl px-4 py-3 text-white placeholder:text-[color:var(--color-muted)] outline-none focus:border-[color:var(--color-green)] transition-colors"
              />
              {state.feedback && (
                <p
                  className={`text-sm ${
                    state.feedbackWarm
                      ? "text-[color:var(--color-coral)]"
                      : "text-[color:var(--color-red)]"
                  }`}
                >
                  {state.feedback}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleHint}
                  disabled={state.hintsUsed >= current.hints.length}
                  className="flex-1 py-2.5 rounded-xl border border-[color:var(--color-border)] text-sm font-semibold text-[color:var(--color-muted)] hover:border-[color:var(--color-purple)] hover:text-[color:var(--color-purple)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Hint {state.hintsUsed > 0 ? `(${state.hintsUsed}/${current.hints.length})` : ""}
                </button>
                <button
                  onClick={handleReveal}
                  disabled={state.hintsUsed < current.hints.length}
                  title={
                    state.hintsUsed < current.hints.length
                      ? `Use all ${current.hints.length} hints to unlock`
                      : "Reveal answer (0 pts)"
                  }
                  className="py-2.5 px-4 rounded-xl border border-[color:var(--color-border)] text-sm font-semibold text-[color:var(--color-muted)] hover:border-[color:var(--color-coral)] hover:text-[color:var(--color-coral)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Reveal
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 py-2.5 rounded-xl bg-[color:var(--color-green)] text-[color:var(--color-navy)] text-sm font-bold hover:opacity-90 transition-opacity"
                >
                  Submit
                </button>
              </div>
            </>
          )}

          {/* Next / Results */}
          {(state.skipped || (state.solved && bonusComplete)) && (
            <button
              onClick={handleNext}
              className="w-full py-2.5 rounded-xl bg-[color:var(--color-green)] text-[color:var(--color-navy)] text-sm font-bold hover:opacity-90 transition-opacity"
            >
              {songIndex < puzzle.length - 1 ? "Next Song →" : "See Results →"}
            </button>
          )}
        </div>

        {/* Score bar */}
        <div className="flex justify-between items-center text-xs text-[color:var(--color-muted)]">
          <span>
            Score: {totalScore.toLocaleString()} / {maxScore.toLocaleString()}
          </span>
          <div className="flex items-center gap-3">
            {streak > 0 && (
              <span className="text-white font-semibold">🔥 {streak}</span>
            )}
            <span>{states.filter((s) => s.solved).length} solved</span>
          </div>
        </div>

      </div>

      {/* Full-screen confetti burst */}
      {fullConfetti && (
        <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden" aria-hidden="true">
          {confettiPieces.map((p) => (
            <div
              key={p.id}
              style={{
                position: "absolute",
                left: `${p.left}%`,
                top: "-12px",
                width: p.size,
                height: p.size,
                borderRadius: p.round ? "50%" : "2px",
                background: p.color,
                animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s forwards`,
              }}
            />
          ))}
        </div>
      )}
    </main>
  );
}
