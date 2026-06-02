"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import { DailyPuzzle } from "@/lib/getDailyPuzzle";
import { validateGuess, isAlmostCorrect } from "@/lib/validateGuess";
import { fetchSongInfo, SongInfo } from "@/lib/fetchSongInfo";
import SongReveal from "@/components/SongReveal";

const HINT_COSTS = [200, 300, 400];
const BASE_SCORE = 1000;
const ARTIST_BONUS = 150;
const YEAR_BONUS = 100;
const YEAR_BONUS_CLOSE = 50;
const MAX_SONG_SCORE = BASE_SCORE + ARTIST_BONUS + YEAR_BONUS;

const WRONG_MESSAGES = ["Not quite…", "Try again.", "Hmm, no."];
const ALMOST_MESSAGES = ["You're very close 👀", "So close. One more try.", "Getting warm…"];

const GENRE_HEX: Record<string, string> = {
  "Pop": "#f472b6", "R&B": "#fb923c", "Hip-Hop": "#facc15",
  "Rock": "#f87171", "Alternative": "#fb7185", "Indie": "#a3e635",
  "Electronic": "#22d3ee", "Country": "#fbbf24", "Metal": "#a1a1aa",
  "Funk": "#c084fc", "Funk/Disco": "#c084fc", "Jazz": "#60a5fa", "Latin": "#34d399", "Pop-Punk": "#e879f9",
  "Folk": "#86efac",
};

const BURST_DOTS = [
  { x: '16%', y: '20%', size: 11, color: '#7b61ff' },
  { x: '81%', y: '15%', size: 8,  color: '#3dfff5' },
  { x: '13%', y: '68%', size: 13, color: '#ff3db4' },
  { x: '84%', y: '64%', size: 9,  color: '#00b4ff' },
  { x: '87%', y: '38%', size: 6,  color: '#ffb13d' },
  { x: '11%', y: '43%', size: 7,  color: '#ff6b3d' },
];

const CONFETTI_PARTICLES = [
  { idx: 0, color: "#00b4ff", delay: 0 },
  { idx: 1, color: "#7b61ff", delay: 30 },
  { idx: 2, color: "#00b4ff", delay: 60 },
  { idx: 3, color: "#ff6b3d", delay: 20 },
  { idx: 4, color: "#7b61ff", delay: 50 },
  { idx: 5, color: "#00b4ff", delay: 40 },
  { idx: 6, color: "#ff6b3d", delay: 10 },
  { idx: 7, color: "#7b61ff", delay: 70 },
  { idx: 8, color: "#00b4ff", delay: 15 },
  { idx: 9, color: "#ff6b3d", delay: 55 },
];

function randomFrom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

function stripFeaturing(title: string): string {
  return title
    .replace(/\s*\(feat\..*?\)/gi, "")
    .replace(/\s*\(ft\..*?\)/gi, "")
    .replace(/\s*\(featuring.*?\)/gi, "")
    .replace(/\s*feat\..*$/gi, "")
    .replace(/\s*FEAT\..*$/g, "")
    .trim();
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

function collapseNumbers(str: string): string {
  let s = str.toLowerCase().replace(/-/g, " ");
  s = s.replace(
    /\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)\s+(one|two|three|four|five|six|seven|eight|nine)\b/g,
    (_, tens, ones) => String(NUMBER_TENS[tens] + NUMBER_ONES[ones])
  );
  s = s.replace(
    /\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)\b/g,
    (_, tens) => String(NUMBER_TENS[tens])
  );
  s = s.replace(
    /\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen)\b/g,
    (_, ones) => String(NUMBER_ONES[ones])
  );
  return s;
}

function normalizeArtist(str: string): string {
  return collapseNumbers(str)
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function validateArtist(guess: string, correct: string): boolean {
  const g = normalizeArtist(guess);
  const c = normalizeArtist(correct);
  if (!g) return false;
  const stripThe = (s: string) => s.replace(/^the\s+/, "");
  if (g === c || stripThe(g) === stripThe(c)) return true;
  // Allow guessing just the main artist of a collab — but use whole-word matching
  // so "Sia" doesn't match "Alessia Cara", "REM" doesn't match "Rema", etc.
  const cWords = c.split(/\s+/);
  const gWords = g.split(/\s+/);
  return gWords.every((gw) => cWords.some((cw) => cw === gw));
}

function validateYear(guess: string, correct: string): "exact" | "close" | false {
  const g = parseInt(guess.trim(), 10);
  const c = parseInt(correct, 10);
  if (isNaN(g)) return false;
  if (g === c) return "exact";
  if (Math.abs(g - c) === 1) return "close";
  return false;
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
    (s.yearCorrect === "exact" ? YEAR_BONUS : s.yearCorrect === "close" ? YEAR_BONUS_CLOSE : 0)
  );
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
  yearCorrect: "exact" | "close" | false | null;
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

function Check({ className = "" }: { className?: string }) {
  return (
    <svg
      width="12" height="12" viewBox="0 0 12 12" fill="none"
      className={`inline-block shrink-0 ${className}`}
      style={{ verticalAlign: "middle", marginTop: "-1px" }}
    >
      <polyline points="1.5,6.5 4.5,9.5 10.5,2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Countdown() {
  const [time, setTime] = useState(formatCountdown());
  useEffect(() => {
    const id = setInterval(() => setTime(formatCountdown()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="text-center flex flex-col gap-1">
      <p className="text-xs text-[color:var(--color-muted)] uppercase tracking-widest">Next puzzle in</p>
      <p className="text-xl font-bold tabular-nums">{time}</p>
    </div>
  );
}

export default function GameClassic({ puzzle, puzzleNumber, genreLabel, allArtists = [] }: { puzzle: DailyPuzzle; puzzleNumber?: number; genreLabel?: string; allArtists?: string[] }) {
  const [songIndex, setSongIndex] = useState(0);
  const [states, setStates] = useState<SongState[]>(puzzle.map(initialSongState));
  const [gameOver, setGameOver] = useState(false);
  const [streak, setStreak] = useState(0);
  const [copied, setCopied] = useState(false);
  const [fullConfetti, setFullConfetti] = useState(false);
  const [artistDropdownOpen, setArtistDropdownOpen] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const artistRef = useRef<HTMLInputElement>(null);
  const artistDropdownRef = useRef<HTMLDivElement>(null);
  const streakRef = useRef(0);



  const current = puzzle[songIndex];
  const state = states[songIndex];

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

  useEffect(() => {
    if (!gameOver) return;
    const solved = states.filter((s) => s.solved).length;
    const newStreak = solved >= 3 ? streakRef.current + 1 : 0;
    streakRef.current = newStreak;
    setStreak(newStreak);
    try {
      localStorage.setItem("tunedecode_streak", JSON.stringify({ lastPlayed: getToday(), streak: newStreak }));
    } catch {}
  }, [gameOver]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const s = states[songIndex];
    if (s.solved && s.artistCorrect === true && s.yearCorrect === "exact") {
      setFullConfetti(true);
      const t = setTimeout(() => setFullConfetti(false), 3000);
      return () => clearTimeout(t);
    }
  }, [songIndex, states[songIndex]?.artistCorrect, states[songIndex]?.yearCorrect]); // eslint-disable-line react-hooks/exhaustive-deps

  const confettiPieces = useMemo(() => {
    if (!fullConfetti) return [];
    const colors = ["#00b4ff", "#7b61ff", "#ff6b3d", "#ffffff", "#ffd700"];
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
    const correct = validateGuess(state.guess, current.title, current.altTitles);
    if (correct) {
      const autoSkipArtist = state.hintsUsed >= 3;
      const autoSkipYear = state.hintsUsed >= 2;
      updateState(songIndex, {
        solved: true,
        feedback: "",
        songInfo: "loading",
        glow: true,
        shake: false,
        ...(autoSkipArtist ? { artistCorrect: false } : {}),
        ...(autoSkipYear ? { yearCorrect: false as false } : {}),
      });
      setTimeout(() => updateState(songIndex, { glow: false }), 1000);
      const info = await fetchSongInfo(current.title, current.artist);
      if (info && current.releaseYear) info.releaseYear = current.releaseYear;
      if (info && current.genre) info.genre = current.genre;
      updateState(songIndex, { songInfo: info });
    } else {
      const almost = isAlmostCorrect(state.guess, current.title, current.altTitles);
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
      yearFeedback: correct === "exact"
        ? randomFrom(["+100. Dialed in.", "Year on point."])
        : correct === "close"
        ? randomFrom(["+50. One year off.", "Close — within a year."])
        : randomFrom(["Wrong year. Guess again.", "Off by more than one."]),
    });
  }

  function handleSkipBonus() {
    if (state.artistCorrect === null && state.hintsUsed < 3) {
      // Skip just the artist — reveal year input next
      updateState(songIndex, { artistCorrect: false });
    } else {
      // Skip year (or finish if both done)
      updateState(songIndex, {
        bonusDone: true,
        artistCorrect: state.artistCorrect ?? false,
        yearCorrect: state.yearCorrect ?? false as false,
      });
    }
  }

  function handleHint() {
    if (state.hintsUsed >= current.hints.length || state.solved) return;
    updateState(songIndex, {
      hintsUsed: state.hintsUsed + 1,
      feedback: "",
      feedbackWarm: false,
    });
  }

  function handleReveal() {
    if (state.hintsUsed < current.hints.length) return;
    updateState(songIndex, { skipped: true, feedback: "" });
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
    const emojis = states.map((s) => (!s.solved ? "⬜" : s.hintsUsed === 0 ? "🟩" : "🟨")).join(" ");
    const label = genreLabel ? genreLabel : `#${puzzleNumber}`;
    return `TuneTwist ${label}  ${solvedCount}/${puzzle.length}\n${score.toLocaleString()} pts\n\n${emojis}\n\ntunetwist.com`;
  }

  function handleCopyResults(score: number) {
    navigator.clipboard.writeText(buildShareText(score)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function togglePreview(song: DailyPuzzle[number]) {
    if (!song.previewUrl) return;
    if (playingId === song.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(song.previewUrl);
      audio.onended = () => setPlayingId(null);
      audio.play();
      audioRef.current = audio;
      setPlayingId(song.id);
    }
  }



  const bonusComplete =
    state.bonusDone || (state.artistCorrect !== null && state.yearCorrect !== null);

  const totalScore = states.reduce((sum, s) => sum + totalSongScore(s), 0);
  const maxScore = puzzle.length * MAX_SONG_SCORE;

  const genreColor = GENRE_HEX[current.genre ?? ""] ?? "#71717a";
  const decade = current.releaseYear
    ? `${Math.floor(parseInt(current.releaseYear) / 10) * 10}s`
    : "";

  // ── Results screen ────────────────────────────────────────────────────────
  if (gameOver) {
    const solvedCount = states.filter((s) => s.solved).length;
    return (
      <main className="flex flex-col items-center justify-start min-h-[calc(100svh-8rem)] px-4 pt-8 pb-6">
        <div className="w-full max-w-[560px] flex flex-col gap-6">
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <Image src="/logo.png" alt="TitleTwist" width={220} height={110} className="object-contain" />
            </div>
            {streak > 0 && (
              <p className="text-sm text-[color:var(--color-muted)] mt-1">🔥 {streak}-day streak</p>
            )}
          </div>

          <div className="bg-[color:var(--color-card)] border border-[color:var(--color-border)] rounded-2xl px-6 py-5">
            <p className="text-[color:var(--color-muted)] text-xs uppercase tracking-widest text-center mb-3">Share Preview</p>
            <pre className="text-sm text-center whitespace-pre font-mono leading-relaxed">{buildShareText(totalScore)}</pre>
          </div>

          <button
            onClick={() => handleCopyResults(totalScore)}
            className="w-full py-3.5 rounded-xl bg-[color:var(--color-green)] text-[color:var(--color-navy)] text-sm font-bold hover:opacity-90 transition-opacity"
          >
            {copied ? <><Check className="text-[color:var(--color-navy)]" /> Copied!</> : "Copy Results"}
          </button>

          <div className="bg-[color:var(--color-card)] border border-[color:var(--color-border)] rounded-2xl p-8 flex flex-col gap-5">
            <p className="text-[color:var(--color-muted)] text-xs uppercase tracking-widest text-center">
              {genreLabel ? genreLabel : `Today's Results — #${puzzleNumber}`}
            </p>
            <p className="text-3xl font-bold text-center">{totalScore.toLocaleString()} pts</p>
            <p className="text-[color:var(--color-muted)] text-sm text-center">
              {solvedCount} of {puzzle.length} songs decoded
            </p>
            <div className="text-center text-2xl tracking-widest">
              {states.map((s, i) => (
                <span key={i}>{!s.solved ? "⬜" : s.hintsUsed === 0 ? "🟩" : "🟨"}</span>
              ))}
            </div>
            <div className="flex flex-col gap-3 mt-1">
              {puzzle.map((song, i) => {
                const s = states[i];
                return (
                  <div key={song.id} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {song.previewUrl && (
                          <button
                            onClick={() => togglePreview(song)}
                            className="w-7 h-7 flex items-center justify-center rounded-full bg-[color:var(--color-green)] text-[color:var(--color-navy)] hover:opacity-80 transition-opacity flex-shrink-0"
                            aria-label={playingId === song.id ? "Pause" : "Play preview"}
                          >
                            {playingId === song.id ? "■" : "▶"}
                          </button>
                        )}
                        <span className={s.solved ? "text-white font-semibold" : "text-[color:var(--color-muted)] line-through"}>
                          {song.title}
                        </span>
                      </div>
                      <span className={`font-semibold ${s.solved ? "text-[color:var(--color-green)]" : "text-[color:var(--color-muted)]"}`}>
                        {totalSongScore(s)} pts
                      </span>
                    </div>
                    {s.solved && (
                      <div className="flex gap-2 text-xs">
                        <span style={{ color: s.artistCorrect ? "#22c55e" : "#ef4444" }}>
                          {s.artistCorrect ? <><Check className="text-[#22c55e]" /> Artist</> : "✕ Artist"}
                        </span>
                        <span style={{ color: s.yearCorrect === "exact" ? "#22c55e" : s.yearCorrect === "close" ? "#facc15" : "#ef4444" }}>
                          {s.yearCorrect === "exact" ? <><Check className="text-[#22c55e]" /> Year</> : s.yearCorrect === "close" ? "~ Year" : "✕ Year"}
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
    <main className="relative flex flex-col items-center justify-start md:justify-center min-h-[calc(100svh-8rem)] px-4 py-6 overflow-x-hidden overflow-y-auto">

      {/* Scattered background elements */}
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

      <div className="relative z-10 w-full max-w-[560px] flex flex-col gap-6">

        {/* Dot tracker — desktop only */}
        <div className="hidden sm:flex justify-center gap-2">
          {puzzle.map((_, i) => {
            const s = states[i];
            const isDone = s.solved || s.skipped;
            const isActive = i === songIndex;
            return (
              <button
                key={i}
                onClick={() => setSongIndex(i)}
                className={`transition-all rounded-full ${
                  isActive ? "w-4 h-2.5 bg-white"
                  : isDone && s.solved ? "w-2.5 h-2.5 bg-[color:var(--color-green)]"
                  : isDone ? "w-2.5 h-2.5 bg-[color:var(--color-red)]"
                  : "w-2.5 h-2.5 bg-[color:var(--color-border)]"
                }`}
              />
            );
          })}
        </div>

        {/* Song card — classic */}
        {/* Glow blobs behind card */}
        <div className="relative w-full">
          <div className="absolute pointer-events-none" style={{ inset: '-120px', zIndex: 0 }}>
            <div style={{ position: 'absolute', top: '0%', left: '-15%', width: '75%', height: '80%', background: 'radial-gradient(ellipse at center, var(--blob-a-hi) 0%, var(--blob-a-lo) 45%, transparent 72%)', filter: 'blur(50px)', animation: 'blob-drift-a 12s ease-in-out infinite' }} />
            <div style={{ position: 'absolute', bottom: '0%', right: '-12%', width: '72%', height: '78%', background: 'radial-gradient(ellipse at center, var(--blob-b-hi) 0%, var(--blob-b-lo) 45%, transparent 72%)', filter: 'blur(54px)', animation: 'blob-drift-b 15s ease-in-out 2s infinite' }} />
            <div style={{ position: 'absolute', top: '25%', right: '0%', width: '55%', height: '60%', background: 'radial-gradient(ellipse at center, var(--blob-c-hi) 0%, var(--blob-c-lo) 45%, transparent 72%)', filter: 'blur(46px)', animation: 'blob-drift-c 18s ease-in-out 5s infinite' }} />
          </div>
        {/* Gradient border wrapper */}
        <div className="relative z-10 w-full p-[2px] rounded-3xl" style={{ background: `linear-gradient(135deg, ${genreColor}99 0%, var(--color-purple) 40%, var(--color-coral) 70%, ${genreColor}44 100%)` }}>
        <div className={`relative w-full bg-[color:var(--color-card)] rounded-[22px] ${state.shake ? "animate-shake" : ""} ${state.glow ? "animate-glow" : ""}`}>

          {/* Confetti burst */}
          {state.glow && (
            <div className="absolute top-1/3 left-1/2 pointer-events-none" aria-hidden="true">
              {CONFETTI_PARTICLES.map((p) => (
                <span key={p.idx} style={{ position: "absolute", width: 7, height: 7, borderRadius: "50%", background: p.color, animation: `confetti-${p.idx} 0.75s ease-out ${p.delay}ms forwards` }} />
              ))}
            </div>
          )}

          {/* Card header */}
          <div className="px-5 pt-2 pb-2 flex flex-col items-center text-center">
            <div className="relative flex items-center justify-center w-full mb-2">
              <span className="absolute left-0 text-[10px] text-[color:var(--color-muted)] opacity-60">
                {state.solved ? "Identified" : state.skipped ? "Skipped" : "Song"} {songIndex + 1}/{puzzle.length}
              </span>
              <span
                className="text-xs font-bold px-3 py-1 rounded-full"
                style={{ background: `${genreColor}22`, color: genreColor }}
              >
                {current.genre ?? "Unknown"} · {decade}
              </span>
            </div>

            <p
              className="leading-[1.15] text-[1.9rem] font-semibold pb-1"
              style={{ fontFamily: "var(--font-poppins)", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "visible" }}
            >
              {state.solved || state.skipped ? current.title : stripFeaturing(current.synonymTitle)}
            </p>

            {(state.bonusDone || state.skipped) && (
              <p className="text-sm text-[color:var(--color-muted)] mt-2">{current.artist}</p>
            )}
          </div>

          <div className="h-px bg-[color:var(--color-border)] mx-5" />

          {/* Hints */}
          {state.hintsUsed > 0 && (
            <div className="px-5 pt-4 flex flex-col gap-1.5">
              {current.hints.slice(0, state.hintsUsed).map((hint, hi) => (
                <div key={hi} className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-[color:var(--color-navy)] border border-[color:var(--color-purple)] text-[color:var(--color-purple)]">
                  <span className="opacity-60 text-xs">Hint {hi + 1}</span>
                  <span>{hint}</span>
                </div>
              ))}
            </div>
          )}

          {/* Main content — single question slot, card height stays fixed */}
          <div className="flex flex-col gap-3 px-5 pt-3 pb-4">

            {/* Phase: guessing */}
            {!state.solved && !state.skipped && (
              <>
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="w-full">
                  <div className="gradient-border w-full">
                    <input
                      ref={inputRef}
                      type="text"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      value={state.guess}
                      onChange={(e) => updateState(songIndex, { guess: e.target.value, feedback: "" })}
                      placeholder="Name that track…"
                      className="w-full bg-[color:var(--color-navy)] rounded-[11px] px-4 py-3 text-base text-white placeholder:text-[color:var(--color-muted)] outline-none"
                    />
                  </div>
                </form>
                {state.feedback && (
                  <p className={`text-sm ${state.feedbackWarm ? "text-[color:var(--color-coral)]" : "text-[color:var(--color-red)]"}`}>{state.feedback}</p>
                )}
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="w-full py-2 rounded-xl font-bold text-sm text-white hover:opacity-90 transition-opacity cursor-pointer touch-manipulation"
                    style={{ background: 'var(--btn-gradient)' }}
                  >
                    Submit
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleHint}
                      disabled={state.hintsUsed >= current.hints.length}
                      className="flex-1 py-2 rounded-xl border border-[color:var(--color-border)] text-[color:var(--color-muted)] hover:text-[color:var(--color-purple)] hover:border-[color:var(--color-purple)] disabled:opacity-30 transition-colors cursor-pointer touch-manipulation text-sm font-semibold"
                    >
                      Hint {state.hintsUsed < current.hints.length ? `(−${HINT_COSTS[state.hintsUsed]} pts)` : `(${state.hintsUsed}/${current.hints.length} used)`}
                    </button>
                    <button
                      type="button"
                      onClick={handleReveal}
                      disabled={state.hintsUsed < current.hints.length}
                      className="flex-1 py-2 rounded-xl border border-white/20 text-white/60 hover:text-[color:var(--color-coral)] hover:border-[color:var(--color-coral)] disabled:opacity-50 transition-colors cursor-pointer text-sm font-semibold"
                    >
                      Reveal
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Phase: artist bonus */}
            {state.solved && !bonusComplete && state.artistCorrect === null && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold" style={{ color: "#22c55e" }}>✓ {current.title}</span>
                  <span className="text-xs text-[color:var(--color-muted)]">+{titleScore(state.hintsUsed, true)} pts</span>
                </div>
                <label className="text-xs text-[color:var(--color-muted)]">Who&apos;s the artist? <span className="opacity-50">(+{ARTIST_BONUS} pts)</span></label>
                <div className="relative" ref={artistDropdownRef}>
                  <form onSubmit={(e) => { e.preventDefault(); handleArtistSubmit(); }} className="w-full">
                    <div className="gradient-border mx-[2px]">
                      <input
                        ref={artistRef}
                        type="text"
                        value={state.artistGuess}
                        onChange={(e) => { updateState(songIndex, { artistGuess: e.target.value, artistFeedback: "" }); setArtistDropdownOpen(true); }}
                        onFocus={() => setArtistDropdownOpen(true)}
                        onBlur={() => setTimeout(() => setArtistDropdownOpen(false), 150)}
                        placeholder="Type to search…"
                        className="w-full bg-[color:var(--color-navy)] rounded-[11px] px-4 py-3 text-base text-white placeholder:text-[color:var(--color-muted)] outline-none"
                      />
                    </div>
                  </form>
                  {artistDropdownOpen && state.artistGuess.trim().length > 0 && (() => {
                    const q = state.artistGuess.toLowerCase();
                    const matches = allArtists.filter((a) => a.toLowerCase().includes(q)).slice(0, 8);
                    return matches.length > 0 ? (
                      <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-[color:var(--color-navy)] border border-[color:var(--color-border)] rounded-xl overflow-hidden shadow-xl">
                        {matches.map((a) => (
                          <button key={a} onMouseDown={() => { setArtistDropdownOpen(false); updateState(songIndex, { artistGuess: a, artistFeedback: "", artistCorrect: validateArtist(a, current.artist) }); }} className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/10 transition-colors">{a}</button>
                        ))}
                      </div>
                    ) : null;
                  })()}
                </div>
                <button
                  type="button"
                  onClick={handleArtistSubmit}
                  className="w-full py-3 rounded-xl font-bold text-sm text-white hover:opacity-90 transition-opacity cursor-pointer touch-manipulation"
                  style={{ background: 'var(--btn-gradient)' }}
                >
                  Submit Artist
                </button>
                <button type="button" onClick={handleSkipBonus} className="text-xs text-[color:var(--color-muted)] hover:text-white transition-colors text-left cursor-pointer">
                  Skip →
                </button>
              </>
            )}

            {/* Phase: year bonus */}
            {state.solved && !bonusComplete && state.artistCorrect !== null && state.yearCorrect === null && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold" style={{ color: "#22c55e" }}>✓ {current.title}</span>
                  <span className="text-xs text-[color:var(--color-muted)]">+{titleScore(state.hintsUsed, true)} pts</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.4rem 0.75rem", borderRadius: "0.6rem", border: `1px solid ${state.artistCorrect ? "#22c55e" : "#ef4444"}`, background: state.artistCorrect ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)" }}>
                  <span className="text-sm text-white">{state.artistCorrect ? state.artistGuess || current.artist : current.artist}</span>
                  <span className="text-xs font-bold" style={{ color: state.artistCorrect ? "#22c55e" : "#ef4444" }}>{state.artistCorrect ? `+${ARTIST_BONUS}` : "✗"}</span>
                </div>
                <label className="text-xs text-[color:var(--color-muted)]">What year was it released? <span className="opacity-50">(+{YEAR_BONUS} pts)</span></label>
                <form onSubmit={(e) => { e.preventDefault(); handleYearSubmit(); }} className="w-full">
                  <div className="gradient-border mx-[2px]">
                    <input
                      type="text"
                      inputMode="numeric"
                      enterKeyHint="go"
                      value={state.yearGuess}
                      onChange={(e) => updateState(songIndex, { yearGuess: e.target.value, yearFeedback: "" })}
                      placeholder="e.g. 1984"
                      className="w-full bg-[color:var(--color-navy)] rounded-[11px] px-4 py-3 text-base text-white placeholder:text-[color:var(--color-muted)] outline-none"
                    />
                  </div>
                </form>
                <button
                  type="button"
                  onClick={handleYearSubmit}
                  className="w-full py-3 rounded-xl font-bold text-sm text-white hover:opacity-90 transition-opacity cursor-pointer touch-manipulation"
                  style={{ background: 'var(--btn-gradient)' }}
                >
                  Submit Year
                </button>
                <button type="button" onClick={handleSkipBonus} className="text-xs text-[color:var(--color-muted)] hover:text-white transition-colors text-left cursor-pointer">
                  Skip →
                </button>
              </>
            )}

            {/* Phase: skipped */}
            {state.skipped && (
              <div className="flex flex-col gap-1">
                <p className="text-xs text-[color:var(--color-coral)] font-medium">{state.feedback}</p>
                <p className="text-sm text-[color:var(--color-muted)]">{current.title} — {current.artist}</p>
              </div>
            )}

            {/* Phase: bonus complete */}
            {state.solved && bonusComplete && (
              <div className="flex flex-col gap-3">
                <div className="flex gap-3 text-sm">
                  <span style={{ color: state.artistCorrect ? "#22c55e" : "#ef4444" }}>
                    {state.artistCorrect ? `✓ Artist +${ARTIST_BONUS}` : `✗ Artist (${current.artist})`}
                  </span>
                  <span style={{ color: state.yearCorrect === "exact" ? "#22c55e" : state.yearCorrect === "close" ? "#facc15" : "#ef4444" }}>
                    {state.yearCorrect === "exact" ? `✓ Year +${YEAR_BONUS}` : state.yearCorrect === "close" ? `~ Year +${YEAR_BONUS_CLOSE}` : `✗ Year (${state.songInfo && state.songInfo !== "loading" ? state.songInfo.releaseYear : current.releaseYear ?? ""})`}
                  </span>
                </div>
                <SongReveal info={state.songInfo} />
              </div>
            )}

            {(state.skipped || (state.solved && bonusComplete)) && (
              <button type="button" onClick={handleNext} className="w-full py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-opacity cursor-pointer" style={{ background: 'var(--btn-gradient)' }}>
                {songIndex < puzzle.length - 1 ? "Next Song →" : "See Results →"}
              </button>
            )}
          </div>

          {/* Mobile progress bar */}
          <div className="sm:hidden flex gap-1 px-4 pb-3">
            {puzzle.map((_, i) => {
              const s = states[i];
              const isDone = s.solved || s.skipped;
              const isActive = i === songIndex;
              return (
                <button
                  key={i}
                  onClick={() => isDone ? setSongIndex(i) : undefined}
                  disabled={!isDone && !isActive}
                  className="flex-1 h-1 rounded-full transition-all"
                  style={{
                    background: isActive
                      ? "rgba(255,255,255,0.9)"
                      : s.solved && s.hintsUsed === 0
                      ? "var(--color-green)"
                      : s.solved && s.hintsUsed > 0
                      ? "#facc15"
                      : s.skipped
                      ? "var(--color-red)"
                      : "rgba(255,255,255,0.15)",
                  }}
                />
              );
            })}
          </div>

        </div>
        </div>
        </div>

        {/* Score bar */}
        <div className="flex justify-between items-center text-xs text-[color:var(--color-muted)]">
          <span>Score: {totalScore.toLocaleString()} / {maxScore.toLocaleString()}</span>
          <div className="flex items-center gap-3">
            {streak > 0 && <span className="text-white font-semibold">🔥 {streak}</span>}
            <span>{states.filter((s) => s.solved).length} of {puzzle.length} solved</span>
          </div>
        </div>

      </div>

      {/* Full-screen confetti */}
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
