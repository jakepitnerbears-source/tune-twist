"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import { DailyPuzzle } from "@/lib/getDailyPuzzle";
import { validateGuess, isAlmostCorrect } from "@/lib/validateGuess";
import { fetchSongInfo, SongInfo } from "@/lib/fetchSongInfo";
import SongReveal from "@/components/SongReveal";
import StarRating from "@/components/StarRating";

const HINT_COSTS = [200, 300, 400];
const BASE_SCORE = 1000;
const ARTIST_BONUS = 150;
const YEAR_BONUS = 100;
const YEAR_BONUS_CLOSE = 50;
const MAX_SONG_SCORE = BASE_SCORE + ARTIST_BONUS + YEAR_BONUS;

const CORRECT_MESSAGES = ["Nice. That was quick.", "You got that 👀", "Clean solve.", "That one trips people up.", "Locked in."];
const WRONG_MESSAGES = ["Not quite…", "Try again.", "Hmm, no."];
const ALMOST_MESSAGES = ["You're very close 👀", "So close. One more try.", "Getting warm…"];
const HINT_MESSAGES = ["Here's a nudge.", "Getting warmer.", "Almost there…"];
const SKIP_MESSAGES = ["No points for this one.", "Revealed."];

const GENRE_HEX: Record<string, string> = {
  "Pop": "#f472b6", "R&B": "#fb923c", "Hip-Hop": "#facc15",
  "Rock": "#f87171", "Alternative": "#fb7185", "Indie": "#a3e635",
  "Electronic": "#22d3ee", "Country": "#fbbf24", "Metal": "#a1a1aa",
  "Funk/Disco": "#c084fc", "Latin": "#34d399", "Pop-Punk": "#e879f9",
};

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
  s = s.replace(/\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)\s+(one|two|three|four|five|six|seven|eight|nine)\b/g, (_, tens, ones) => String(NUMBER_TENS[tens] + NUMBER_ONES[ones]));
  s = s.replace(/\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)\b/g, (_, tens) => String(NUMBER_TENS[tens]));
  s = s.replace(/\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen)\b/g, (_, ones) => String(NUMBER_ONES[ones]));
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

function starRating(score: number, maxScore: number): number {
  const pct = score / maxScore;
  if (pct >= 0.9) return 5;
  if (pct >= 0.7) return 4;
  if (pct >= 0.5) return 3;
  if (pct >= 0.2) return 2;
  if (pct > 0) return 1;
  return 0;
}

function getToday(): string { return new Date().toISOString().split("T")[0]; }
function getYesterday(): string {
  const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().split("T")[0];
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
  hintsUsed: number; solved: boolean; skipped: boolean;
  guess: string; feedback: string; feedbackWarm: boolean;
  shake: boolean; glow: boolean; songInfo: SongInfo | null | "loading";
  bonusDone: boolean; artistGuess: string; artistCorrect: boolean | null;
  artistFeedback: string; yearGuess: string;
  yearCorrect: "exact" | "close" | false | null; yearFeedback: string;
}

function initialSongState(): SongState {
  return {
    hintsUsed: 0, solved: false, skipped: false,
    guess: "", feedback: "", feedbackWarm: false,
    shake: false, glow: false, songInfo: null,
    bonusDone: false, artistGuess: "", artistCorrect: null,
    artistFeedback: "", yearGuess: "", yearCorrect: null, yearFeedback: "",
  };
}

function Check({ className = "" }: { className?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`inline-block shrink-0 ${className}`} style={{ verticalAlign: "middle", marginTop: "-1px" }}>
      <polyline points="1.5,6.5 4.5,9.5 10.5,2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Countdown() {
  const [time, setTime] = useState(formatCountdown());
  useEffect(() => { const id = setInterval(() => setTime(formatCountdown()), 1000); return () => clearInterval(id); }, []);
  return (
    <div className="text-center flex flex-col gap-1">
      <p className="text-xs text-[color:var(--color-muted)] uppercase tracking-widest">Next puzzle in</p>
      <p className="text-xl font-bold tabular-nums">{time}</p>
    </div>
  );
}

export default function GameMedia({ puzzle, puzzleNumber, genreLabel, allArtists = [], previewUrls = [] }: {
  puzzle: DailyPuzzle; puzzleNumber?: number; genreLabel?: string; allArtists?: string[]; previewUrls?: string[];
}) {
  const [songIndex, setSongIndex] = useState(0);
  const [states, setStates] = useState<SongState[]>(puzzle.map(initialSongState));
  const [gameOver, setGameOver] = useState(false);
  const [streak, setStreak] = useState(0);
  const [copied, setCopied] = useState(false);
  const [fullConfetti, setFullConfetti] = useState(false);
  const [artistDropdownOpen, setArtistDropdownOpen] = useState(false);
  const [playingPreview, setPlayingPreview] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const artistRef = useRef<HTMLInputElement>(null);
  const artistDropdownRef = useRef<HTMLDivElement>(null);
  const streakRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const current = puzzle[songIndex];
  const state = states[songIndex];
  const genreColor = GENRE_HEX[current.genre ?? ""] ?? "#71717a";
  const decade = current.releaseYear ? `${Math.floor(parseInt(current.releaseYear) / 10) * 10}s` : "";

  useEffect(() => {
    try {
      const stored = localStorage.getItem("tunedecode_streak");
      if (stored) {
        const data = JSON.parse(stored) as { lastPlayed: string; streak: number };
        if (data.lastPlayed === getToday() || data.lastPlayed === getYesterday()) {
          streakRef.current = data.streak; setStreak(data.streak);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!gameOver) return;
    const solved = states.filter((s) => s.solved).length;
    const newStreak = solved >= 3 ? streakRef.current + 1 : 0;
    streakRef.current = newStreak; setStreak(newStreak);
    try { localStorage.setItem("tunedecode_streak", JSON.stringify({ lastPlayed: getToday(), streak: newStreak })); } catch {}
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
      id: i, left: Math.random() * 100, size: 6 + Math.random() * 7,
      round: Math.random() > 0.5, color: colors[Math.floor(Math.random() * colors.length)],
      duration: 1.8 + Math.random() * 1.8, delay: Math.random() * 1.0,
    }));
  }, [fullConfetti]);

  useEffect(() => { if (!state.solved && !state.skipped) inputRef.current?.focus(); }, [songIndex, state.solved, state.skipped]);
  useEffect(() => { if (state.solved && !state.bonusDone && state.artistCorrect === null) artistRef.current?.focus(); }, [state.solved, state.bonusDone, state.artistCorrect]);

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
        solved: true, feedback: randomFrom(CORRECT_MESSAGES), songInfo: "loading", glow: true, shake: false,
        ...(autoSkipArtist ? { artistCorrect: false } : {}),
        ...(autoSkipYear ? { yearCorrect: false as false } : {}),
      });
      setTimeout(() => updateState(songIndex, { glow: false }), 1000);
      const info = await fetchSongInfo(current.title, current.artist);
      if (info && current.releaseYear) info.releaseYear = current.releaseYear;
      updateState(songIndex, { songInfo: info });
    } else {
      const almost = isAlmostCorrect(state.guess, current.title, current.altTitles);
      updateState(songIndex, { feedback: almost ? randomFrom(ALMOST_MESSAGES) : randomFrom(WRONG_MESSAGES), feedbackWarm: almost, shake: true });
      setTimeout(() => updateState(songIndex, { shake: false }), 500);
    }
  }

  function handleArtistSubmit() {
    if (!state.artistGuess.trim() || state.artistCorrect !== null) return;
    const correct = validateArtist(state.artistGuess, current.artist);
    updateState(songIndex, {
      artistCorrect: correct,
      artistFeedback: correct ? randomFrom(["+150. You know your stuff.", "Artist locked in."]) : randomFrom(["Not quite. Try again.", "Close?"]),
    });
  }

  function handleYearSubmit() {
    if (!state.yearGuess.trim() || state.yearCorrect !== null) return;
    const releaseYear = state.songInfo && state.songInfo !== "loading" ? state.songInfo.releaseYear : current.releaseYear ?? "";
    const correct = validateYear(state.yearGuess, releaseYear);
    updateState(songIndex, {
      yearCorrect: correct,
      yearFeedback: correct === "exact" ? randomFrom(["+100. Dialed in.", "Year on point."]) : correct === "close" ? randomFrom(["+50. One year off.", "Close — within a year."]) : randomFrom(["Wrong year. Guess again.", "Off by more than one."]),
    });
  }

  function stopPreview() {
    if (audioTimerRef.current) clearTimeout(audioTimerRef.current);
    audioRef.current?.pause(); audioRef.current = null; setPlayingPreview(false);
  }

  useEffect(() => { stopPreview(); }, [songIndex]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { stopPreview(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function togglePreview() {
    const url = previewUrls[songIndex];
    if (!url) return;
    if (playingPreview) { stopPreview(); return; }
    stopPreview();
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.play(); audio.onended = () => setPlayingPreview(false);
    audioTimerRef.current = setTimeout(stopPreview, 3000);
    setPlayingPreview(true);
  }

  function handleSkipBonus() {
    updateState(songIndex, { bonusDone: true, artistCorrect: state.artistCorrect ?? false, yearCorrect: state.yearCorrect ?? false as false });
  }

  function handleHint() {
    if (state.hintsUsed >= current.hints.length || state.solved) return;
    updateState(songIndex, { hintsUsed: state.hintsUsed + 1, feedback: randomFrom(HINT_MESSAGES), feedbackWarm: false });
  }

  function handleReveal() {
    if (state.hintsUsed < current.hints.length) return;
    updateState(songIndex, { skipped: true, feedback: randomFrom(SKIP_MESSAGES) });
  }

  function handleNext() {
    if (songIndex < puzzle.length - 1) setSongIndex(songIndex + 1);
    else setGameOver(true);
  }

  function buildShareText(score: number): string {
    const solvedCount = states.filter((s) => s.solved).length;
    const stars = starRating(score, maxScore);
    const starEmojis = "⭐".repeat(stars) + "☆".repeat(5 - stars);
    const emojis = states.map((s) => (!s.solved ? "⬜" : s.hintsUsed === 0 ? "🟩" : "🟨")).join(" ");
    const label = genreLabel ? genreLabel : `#${puzzleNumber}`;
    return `TuneTwist ${label}  ${solvedCount}/${puzzle.length}\n${starEmojis}\n\n${emojis}\n\ntunetwist.com`;
  }

  function handleCopyResults(score: number) {
    navigator.clipboard.writeText(buildShareText(score)).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  const bonusComplete = state.bonusDone || (state.artistCorrect !== null && state.yearCorrect !== null);
  const totalScore = states.reduce((sum, s) => sum + totalSongScore(s), 0);
  const maxScore = puzzle.length * MAX_SONG_SCORE;
  const hintProgress = current.hints.length > 0 ? (state.hintsUsed / current.hints.length) * 100 : 0;

  // ── Results screen ─────────────────────────────────────────────────────────
  if (gameOver) {
    const stars = starRating(totalScore, maxScore);
    const solvedCount = states.filter((s) => s.solved).length;
    return (
      <main className="flex flex-col items-center justify-center min-h-[calc(100svh-8rem)] px-4 py-6">
        <div className="w-full max-w-[480px] flex flex-col gap-6">
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <Image src="/logo.png" alt="TitleTwist" width={220} height={110} className="object-contain" />
            </div>
            {streak > 0 && <p className="text-sm text-[color:var(--color-muted)] mt-1">🔥 {streak}-day streak</p>}
          </div>
          <div className="bg-[color:var(--color-card)] border border-[color:var(--color-border)] rounded-2xl px-6 py-5">
            <p className="text-[color:var(--color-muted)] text-xs uppercase tracking-widest text-center mb-3">Share Preview</p>
            <pre className="text-sm text-center whitespace-pre font-mono leading-relaxed">{buildShareText(totalScore)}</pre>
          </div>
          <button onClick={() => handleCopyResults(totalScore)} className="w-full py-3.5 rounded-xl bg-[color:var(--color-green)] text-[color:var(--color-navy)] text-sm font-bold hover:opacity-90 transition-opacity">
            {copied ? <><Check className="text-[color:var(--color-navy)]" /> Copied!</> : "Copy Results"}
          </button>
          <div className="bg-[color:var(--color-card)] border border-[color:var(--color-border)] rounded-2xl p-8 flex flex-col gap-5">
            <p className="text-[color:var(--color-muted)] text-xs uppercase tracking-widest text-center">{genreLabel ? genreLabel : `Today's Results — #${puzzleNumber}`}</p>
            <div className="flex justify-center"><StarRating stars={stars} size={28} /></div>
            <p className="text-3xl font-bold text-center">{totalScore.toLocaleString()} pts</p>
            <p className="text-[color:var(--color-muted)] text-sm text-center">{solvedCount} of {puzzle.length} songs decoded</p>
            <div className="text-center text-2xl tracking-widest">
              {states.map((s, i) => (<span key={i}>{!s.solved ? "⬜" : s.hintsUsed === 0 ? "🟩" : "🟨"}</span>))}
            </div>
            <div className="flex flex-col gap-3 mt-1">
              {puzzle.map((song, i) => {
                const s = states[i];
                return (
                  <div key={song.id} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className={s.solved ? "text-white font-semibold" : "text-[color:var(--color-muted)] line-through"}>{song.title}</span>
                      <span className={`font-semibold ${s.solved ? "text-[color:var(--color-green)]" : "text-[color:var(--color-muted)]"}`}>{totalSongScore(s)} pts</span>
                    </div>
                    {s.solved && (
                      <div className="flex gap-2 text-xs">
                        <span className={s.artistCorrect ? "text-[color:var(--color-green)]" : "text-[color:var(--color-red)]"}>
                          {s.artistCorrect ? <><Check className="text-[color:var(--color-green)]" /> Artist</> : "✕ Artist"}
                        </span>
                        <span className={s.yearCorrect === "exact" ? "text-[color:var(--color-green)]" : s.yearCorrect === "close" ? "text-yellow-400" : "text-[color:var(--color-red)]"}>
                          {s.yearCorrect === "exact" ? <><Check className="text-[color:var(--color-green)]" /> Year</> : s.yearCorrect === "close" ? "~ Year" : "✕ Year"}
                        </span>
                      </div>
                    )}
                    {s.solved && s.songInfo && s.songInfo !== "loading" && <SongReveal info={s.songInfo as SongInfo} />}
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

  // ── Game screen ────────────────────────────────────────────────────────────
  return (
    <main className="relative flex flex-col items-center justify-center min-h-[calc(100svh-8rem)] px-4 py-6 overflow-hidden">

      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '55%', height: '60%', background: 'radial-gradient(ellipse at center, #4c1d95cc 0%, #7b61ff44 40%, transparent 70%)', filter: 'blur(48px)', animation: 'blob-drift-a 12s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '-5%', right: '-8%', width: '50%', height: '55%', background: 'radial-gradient(ellipse at center, #5b21b6bb 0%, #a855f733 40%, transparent 70%)', filter: 'blur(56px)', animation: 'blob-drift-b 15s ease-in-out 2s infinite' }} />
      </div>

      <div className="relative z-10 w-full max-w-[640px] flex flex-col gap-4">

        {/* Logo + dot tracker row */}
        <div className="flex items-center justify-between px-1">
          <Image src="/logo.png" alt="TitleTwist" width={130} height={65} className="object-contain" />
          <div className="flex gap-2">
          {puzzle.map((_, i) => {
            const s = states[i];
            const isDone = s.solved || s.skipped;
            const isActive = i === songIndex;
            return (
              <button key={i} onClick={() => isDone ? setSongIndex(i) : undefined} disabled={!isDone && !isActive}
                className={`transition-all rounded-full ${isActive ? "w-4 h-2.5 bg-white" : isDone && s.solved ? "w-2.5 h-2.5 bg-[color:var(--color-green)]" : isDone ? "w-2.5 h-2.5 bg-[color:var(--color-red)]" : "w-2.5 h-2.5 bg-[color:var(--color-border)]"}`}
              />
            );
          })}
          </div>
        </div>

        {/* Player card */}
        <div className={`relative bg-[color:var(--color-card)] border border-[color:var(--color-border)] rounded-3xl overflow-hidden ${state.shake ? "animate-shake" : ""} ${state.glow ? "animate-glow" : ""}`}>

          {/* Confetti burst */}
          {state.glow && (
            <div className="absolute top-1/3 left-1/2 pointer-events-none z-20" aria-hidden="true">
              {CONFETTI_PARTICLES.map((p) => (
                <span key={p.idx} style={{ position: "absolute", width: 7, height: 7, borderRadius: "50%", background: p.color, animation: `confetti-${p.idx} 0.75s ease-out ${p.delay}ms forwards` }} />
              ))}
            </div>
          )}

          {/* ── Album art — widescreen ── */}
          <div
            className="relative w-full aspect-[16/9] overflow-hidden cursor-pointer"
            style={{ background: `linear-gradient(160deg, ${genreColor}33 0%, ${genreColor}0d 55%, #0a0c14 100%)` }}
            onClick={previewUrls[songIndex] && !state.solved && !state.skipped ? togglePreview : undefined}
          >
            {/* Vinyl record */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="h-[90%] aspect-square rounded-full relative"
                style={{
                  background: `conic-gradient(from 0deg, #0d0f1a 0%, ${genreColor}55 25%, #0d0f1a 45%, ${genreColor}33 70%, #0d0f1a 90%, ${genreColor}22 100%)`,
                  boxShadow: `0 0 60px ${genreColor}22, 0 0 120px ${genreColor}11`,
                  border: "1px solid rgba(255,255,255,0.06)",
                  animation: "vinyl-spin 5s linear infinite",
                  animationPlayState: playingPreview ? "running" : "paused",
                }}
              >
                {/* Grooves */}
                <div className="absolute inset-[15%] rounded-full border border-white/[0.04]" />
                <div className="absolute inset-[30%] rounded-full border border-white/[0.04]" />
                {/* Center hole */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-[18%] aspect-square rounded-full" style={{ background: "#0d0f1a", border: "1px solid rgba(255,255,255,0.12)" }} />
                </div>
              </div>
            </div>

            {/* Genre badge — top left */}
            <div className="absolute top-4 left-4 z-10">
              <span className="text-[11px] font-bold px-3 py-1 rounded-full" style={{ background: `${genreColor}33`, color: genreColor, border: `1px solid ${genreColor}44` }}>
                {current.genre ?? "Unknown"}
              </span>
            </div>

            {/* Song count — top right */}
            <div className="absolute top-4 right-4 z-10">
              <span className="text-[11px] font-semibold text-white/40 tabular-nums">
                {songIndex + 1} / {puzzle.length}
              </span>
            </div>

            {/* Title overlay — bottom */}
            <div
              className="absolute bottom-0 left-0 right-0 z-10 px-5 pt-8 pb-4"
              style={{ background: "linear-gradient(to top, rgba(13,15,26,0.97) 0%, rgba(13,15,26,0.6) 55%, transparent 100%)" }}
            >
              <p
                className="leading-[1.15] text-[2rem] text-white font-semibold"
                style={{ fontFamily: "var(--font-poppins)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
              >
                {state.solved || state.skipped ? current.title : stripFeaturing(current.synonymTitle)}
              </p>
              <p className="text-sm text-white/45 mt-1">
                {state.solved || state.skipped ? current.artist : decade}
              </p>
            </div>

            {/* Hover play overlay */}
            {previewUrls[songIndex] && !state.solved && !state.skipped && (
              <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity" style={{ background: "rgba(0,0,0,0.25)" }}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)" }}>
                  <span className="text-white text-2xl ml-0.5">{playingPreview ? "⏸" : "▶"}</span>
                </div>
              </div>
            )}

            {/* Solved overlay */}
            {state.solved && (
              <div className="absolute inset-0 z-10 flex items-center justify-center" style={{ background: `${genreColor}0d` }}>
                <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: `${genreColor}22`, border: `2px solid ${genreColor}55`, boxShadow: `0 0 32px ${genreColor}33` }}>
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><polyline points="4,17 12,25 28,7" stroke="#00b4ff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
              </div>
            )}

            {/* Skipped overlay */}
            {state.skipped && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-[color:var(--color-red)]/10">
                <div className="w-20 h-20 rounded-full flex items-center justify-center bg-[color:var(--color-red)]/20 border-2 border-[color:var(--color-red)]/40">
                  <span className="text-3xl font-bold text-[color:var(--color-red)]">✕</span>
                </div>
              </div>
            )}
          </div>

          {/* ── Progress / scrubber ── */}
          <div className="px-5 pt-3 pb-1">
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-white/35 tabular-nums w-6 shrink-0">
                {state.hintsUsed > 0 ? `${state.hintsUsed}/${current.hints.length}` : "0"}
              </span>
              <div className="flex-1 h-[3px] bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${hintProgress}%`, background: `linear-gradient(90deg, ${genreColor} 0%, ${genreColor}88 100%)` }}
                />
              </div>
              <span className="text-[10px] text-white/35 tabular-nums w-6 text-right shrink-0">
                -{current.hints.length - state.hintsUsed}
              </span>
            </div>
          </div>

          {/* ── Hints revealed ── */}
          {state.hintsUsed > 0 && !state.solved && !state.skipped && (
            <div className="px-5 pt-2 flex flex-col gap-1.5">
              {current.hints.slice(0, state.hintsUsed).map((hint, hi) => (
                <div key={hi} className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-[color:var(--color-navy)] border border-[color:var(--color-purple)] text-[color:var(--color-purple)]">
                  <span className="opacity-60 text-xs">Hint {hi + 1}</span>
                  <span>{hint}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── Main content area ── */}
          <div className="px-5 pt-2 pb-4 flex flex-col gap-3">

            {state.solved ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-[color:var(--color-green)] font-bold text-sm">
                    <Check className="text-[color:var(--color-green)]" /> {current.title}
                  </span>
                  <span className="text-xs text-[color:var(--color-muted)]">+{titleScore(state.hintsUsed, true)} pts</span>
                </div>
                <p className="text-[color:var(--color-muted)] text-sm -mt-2">{state.feedback}</p>

                {!bonusComplete ? (
                  <div className="flex flex-col gap-3 border-t border-[color:var(--color-border)] pt-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-[color:var(--color-muted)]">
                      Bonus Round — up to +{state.hintsUsed >= 3 ? 0 : state.hintsUsed >= 2 ? ARTIST_BONUS : ARTIST_BONUS + YEAR_BONUS} pts
                    </p>
                    {state.hintsUsed < 3 && (
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-[color:var(--color-muted)]">Who&apos;s the artist?</label>
                        {state.artistCorrect === null ? (
                          <div className="flex gap-2">
                            <div className="relative flex-1" ref={artistDropdownRef}>
                              <input ref={artistRef} type="text" value={state.artistGuess}
                                onChange={(e) => { updateState(songIndex, { artistGuess: e.target.value, artistFeedback: "" }); setArtistDropdownOpen(true); }}
                                onFocus={() => setArtistDropdownOpen(true)}
                                onBlur={() => setTimeout(() => setArtistDropdownOpen(false), 150)}
                                onKeyDown={(e) => e.key === "Enter" && handleArtistSubmit()}
                                placeholder="Type to search artists…"
                                className="w-full bg-[color:var(--color-navy)] border border-[color:var(--color-border)] rounded-xl px-3 py-2 text-sm text-white placeholder:text-[color:var(--color-muted)] outline-none focus:border-[color:var(--color-green)] transition-colors"
                              />
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
                            <button onClick={handleArtistSubmit} className="px-4 py-2 rounded-xl bg-[color:var(--color-green)] text-[color:var(--color-navy)] text-sm font-bold hover:opacity-90 transition-opacity">+{ARTIST_BONUS}</button>
                          </div>
                        ) : (
                          <div className={`flex items-center justify-between px-3 py-2 rounded-xl border ${state.artistCorrect ? "border-[color:var(--color-green)] bg-[color:var(--color-green)]/10" : "border-[color:var(--color-red)] bg-[color:var(--color-red)]/10"}`}>
                            <span className="text-sm text-white">{state.artistCorrect ? state.artistGuess : current.artist}</span>
                            <span className={`text-sm font-bold ${state.artistCorrect ? "text-[color:var(--color-green)]" : "text-[color:var(--color-red)]"}`}>{state.artistCorrect ? `+${ARTIST_BONUS}` : "✕"}</span>
                          </div>
                        )}
                      </div>
                    )}
                    {state.hintsUsed < 2 && (
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-[color:var(--color-muted)]">What year was it released?</label>
                        {state.yearCorrect === null ? (
                          <div className="flex gap-2">
                            <input type="text" inputMode="numeric" value={state.yearGuess} onChange={(e) => updateState(songIndex, { yearGuess: e.target.value, yearFeedback: "" })} onKeyDown={(e) => e.key === "Enter" && handleYearSubmit()} placeholder="" className="flex-1 bg-[color:var(--color-navy)] border border-[color:var(--color-border)] rounded-xl px-3 py-2 text-sm text-white placeholder:text-[color:var(--color-muted)] outline-none focus:border-[color:var(--color-green)] transition-colors" />
                            <button onClick={handleYearSubmit} className="px-4 py-2 rounded-xl bg-[color:var(--color-green)] text-[color:var(--color-navy)] text-sm font-bold hover:opacity-90 transition-opacity">+{YEAR_BONUS}</button>
                          </div>
                        ) : (
                          <div className={`flex items-center justify-between px-3 py-2 rounded-xl border ${state.yearCorrect === "exact" ? "border-[color:var(--color-green)] bg-[color:var(--color-green)]/10" : state.yearCorrect === "close" ? "border-yellow-400 bg-yellow-400/10" : "border-[color:var(--color-red)] bg-[color:var(--color-red)]/10"}`}>
                            <span className="text-sm text-white">{state.yearCorrect ? state.yearGuess : `${state.yearGuess} — answer: ${state.songInfo && state.songInfo !== "loading" ? state.songInfo.releaseYear : current.releaseYear ?? "?"}`}</span>
                            <span className={`text-sm font-bold ${state.yearCorrect === "exact" ? "text-[color:var(--color-green)]" : state.yearCorrect === "close" ? "text-yellow-400" : "text-[color:var(--color-red)]"}`}>{state.yearCorrect === "exact" ? `+${YEAR_BONUS}` : state.yearCorrect === "close" ? `+${YEAR_BONUS_CLOSE}` : "✕"}</span>
                          </div>
                        )}
                      </div>
                    )}
                    <button onClick={handleSkipBonus} className="text-xs text-[color:var(--color-muted)] hover:text-white transition-colors text-left">Skip bonus →</button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 border-t border-[color:var(--color-border)] pt-4">
                    <div className="flex gap-3 text-sm">
                      <span className={state.artistCorrect ? "text-[color:var(--color-green)]" : "text-[color:var(--color-red)]"}>
                        {state.artistCorrect ? <><Check className="text-[color:var(--color-green)]" /> Artist +{ARTIST_BONUS}</> : `✕ Artist (${current.artist})`}
                      </span>
                      <span className={state.yearCorrect === "exact" ? "text-[color:var(--color-green)]" : state.yearCorrect === "close" ? "text-yellow-400" : "text-[color:var(--color-red)]"}>
                        {state.yearCorrect === "exact" ? <><Check className="text-[color:var(--color-green)]" /> Year +{YEAR_BONUS}</> : state.yearCorrect === "close" ? `~ Year +${YEAR_BONUS_CLOSE}` : `✕ Year (${state.songInfo && state.songInfo !== "loading" ? state.songInfo.releaseYear : current.releaseYear ?? ""})`}
                      </span>
                    </div>
                    <SongReveal info={state.songInfo} />
                  </div>
                )}
              </div>
            ) : state.skipped ? (
              <div className="flex flex-col gap-1">
                <p className="text-xs text-[color:var(--color-coral)] font-medium">{state.feedback}</p>
                <p className="text-sm text-[color:var(--color-muted)]">{current.title} — {current.artist}</p>
              </div>
            ) : (
              <>
                {/* Input */}
                <input
                  ref={inputRef}
                  type="text"
                  value={state.guess}
                  onChange={(e) => updateState(songIndex, { guess: e.target.value, feedback: "" })}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  placeholder="Name that track…"
                  className="w-full bg-[color:var(--color-navy)] border border-[color:var(--color-border)] rounded-xl px-4 py-3 text-white placeholder:text-[color:var(--color-muted)] outline-none focus:border-[color:var(--color-green)] transition-colors"
                />
                {state.feedback && (
                  <p className={`text-sm text-center ${state.feedbackWarm ? "text-[color:var(--color-coral)]" : "text-[color:var(--color-red)]"}`}>{state.feedback}</p>
                )}

                {/* Transport controls */}
                <div className="flex items-center justify-center gap-12 pt-1 pb-1">
                  {/* Hint */}
                  <button
                    onClick={handleHint}
                    disabled={state.hintsUsed >= current.hints.length}
                    className="flex flex-col items-center gap-1 group disabled:opacity-30 transition-opacity"
                  >
                    <div className="w-11 h-11 rounded-full border border-white/15 flex items-center justify-center group-hover:border-[color:var(--color-purple)] group-hover:bg-[color:var(--color-purple)]/10 transition-colors disabled:pointer-events-none">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-white/50 group-hover:text-[color:var(--color-purple)] transition-colors" style={{ pointerEvents: "none" }}>
                        <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
                      </svg>
                    </div>
                    <span className="text-[9px] uppercase tracking-widest text-white/35 group-hover:text-[color:var(--color-purple)] transition-colors">
                      {state.hintsUsed > 0 ? `${state.hintsUsed}/${current.hints.length}` : "Hint"}
                    </span>
                  </button>

                  {/* Submit — large circle */}
                  <button
                    onClick={handleSubmit}
                    className="flex flex-col items-center gap-1 group"
                  >
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity"
                      style={{
                        background: `linear-gradient(135deg, #00b4ff 0%, #7fff00 100%)`,
                        boxShadow: `0 4px 24px ${genreColor}44`,
                      }}
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="text-[#0d0f1a] ml-0.5">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                    <span className="text-[9px] uppercase tracking-widest text-white/35 group-hover:text-white transition-colors">Submit</span>
                  </button>

                  {/* Reveal */}
                  <button
                    onClick={handleReveal}
                    disabled={state.hintsUsed < current.hints.length}
                    title={state.hintsUsed < current.hints.length ? `Use all ${current.hints.length} hints first` : "Reveal answer (0 pts)"}
                    className="flex flex-col items-center gap-1 group disabled:opacity-30 transition-opacity"
                  >
                    <div className="w-11 h-11 rounded-full border border-white/15 flex items-center justify-center group-hover:border-[color:var(--color-coral)] group-hover:bg-[color:var(--color-coral)]/10 transition-colors disabled:pointer-events-none">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-white/50 group-hover:text-[color:var(--color-coral)] transition-colors" style={{ pointerEvents: "none" }}>
                        <path d="M6 18l8.5-6L6 6v12zm2-8.14L11.03 12 8 14.14V9.86zM16 6h2v12h-2z" />
                      </svg>
                    </div>
                    <span className="text-[9px] uppercase tracking-widest text-white/35 group-hover:text-[color:var(--color-coral)] transition-colors">Reveal</span>
                  </button>
                </div>
              </>
            )}

            {/* Next / Results */}
            {(state.skipped || (state.solved && bonusComplete)) && (
              <button onClick={handleNext} className="w-full py-2.5 rounded-xl bg-[color:var(--color-green)] text-[color:var(--color-navy)] text-sm font-bold hover:opacity-90 transition-opacity">
                {songIndex < puzzle.length - 1 ? "Next Song →" : "See Results →"}
              </button>
            )}
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
            <div key={p.id} style={{ position: "absolute", left: `${p.left}%`, top: "-12px", width: p.size, height: p.size, borderRadius: p.round ? "50%" : "2px", background: p.color, animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s forwards` }} />
          ))}
        </div>
      )}
    </main>
  );
}
