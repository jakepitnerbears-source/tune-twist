"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import { DailyPuzzle } from "@/lib/getDailyPuzzle";
import { validateGuess, isAlmostCorrect } from "@/lib/validateGuess";
import { fetchSongInfo, SongInfo } from "@/lib/fetchSongInfo";
import HowToPlayModal from "@/components/HowToPlayModal";
import { Lightbulb } from "lucide-react";

// Scoring: title 600 + artist 250 + year 150 = 1000 max per song
const TITLE_SCORES = [800, 600, 400];
const ARTIST_PTS = 100;
const YEAR_PTS = 100;

const WRONG_MESSAGES = ["Not quite…", "Try again.", "Hmm, no."];
const ALMOST_MESSAGES = ["You're very close 👀", "So close.", "Getting warm…"];

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

const GENRE_HEX: Record<string, string> = {
  "Pop": "#f472b6", "R&B": "#fb923c", "Hip-Hop": "#facc15",
  "Rock": "#f87171", "Alternative": "#fb7185", "Indie": "#a3e635",
  "Electronic": "#22d3ee", "Country": "#fbbf24", "Metal": "#a1a1aa",
  "Funk": "#c084fc", "Funk/Disco": "#c084fc", "Jazz": "#60a5fa",
  "Latin": "#34d399", "Pop-Punk": "#e879f9", "Folk": "#86efac",
};

function randomFrom(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function stripFeaturing(title: string) {
  return title
    .replace(/\s*\(feat\..*?\)/gi, "")
    .replace(/\s*\(ft\..*?\)/gi, "")
    .replace(/\s*\(featuring.*?\)/gi, "")
    .replace(/\s*feat\..*$/gi, "")
    .trim();
}

const NUMBER_ONES: Record<string, number> = {
  zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,
  ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,
  sixteen:16,seventeen:17,eighteen:18,nineteen:19,
};
const NUMBER_TENS: Record<string, number> = {
  twenty:20,thirty:30,forty:40,fifty:50,sixty:60,seventy:70,eighty:80,ninety:90,
};

function collapseNumbers(str: string) {
  let s = str.toLowerCase().replace(/-/g, " ");
  s = s.replace(/\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)\s+(one|two|three|four|five|six|seven|eight|nine)\b/g,
    (_, tens, ones) => String(NUMBER_TENS[tens] + NUMBER_ONES[ones]));
  s = s.replace(/\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)\b/g,
    (_, tens) => String(NUMBER_TENS[tens]));
  s = s.replace(/\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen)\b/g,
    (_, ones) => String(NUMBER_ONES[ones]));
  return s;
}

function normalizeArtist(str: string) {
  return collapseNumbers(str).replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function validateArtist(guess: string, correct: string): boolean {
  const g = normalizeArtist(guess);
  const c = normalizeArtist(correct);
  if (!g) return false;
  const stripThe = (s: string) => s.replace(/^the\s+/, "");
  if (g === c || stripThe(g) === stripThe(c)) return true;
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

function getToday() { return new Date().toISOString().split("T")[0]; }
function getYesterday() {
  const d = new Date(); d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

function formatCountdown() {
  const now = new Date();
  const next = new Date(); next.setUTCHours(24, 0, 0, 0);
  const diff = next.getTime() - now.getTime();
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
  artistGuess: string;
  artistCorrect: boolean | null;
  yearGuess: string;
  yearCorrect: "exact" | "close" | false | null;
  bonusDone: boolean;
}

function init(): SongState {
  return {
    hintsUsed: 0, solved: false, skipped: false,
    guess: "", feedback: "", feedbackWarm: false,
    shake: false, glow: false, songInfo: null,
    artistGuess: "", artistCorrect: null,
    yearGuess: "", yearCorrect: null, bonusDone: false,
  };
}

function titlePts(s: SongState) {
  return s.solved ? TITLE_SCORES[Math.min(s.hintsUsed, 3)] : 0;
}
function artistPts(s: SongState) {
  return s.artistCorrect === true ? ARTIST_PTS : 0;
}
function yearPts(s: SongState) {
  if (s.yearCorrect === "exact") return YEAR_PTS;
  if (s.yearCorrect === "close") return Math.round(YEAR_PTS / 2);
  return 0;
}
function songTotal(s: SongState) {
  return titlePts(s) + artistPts(s) + yearPts(s);
}
function isPerfect(s: SongState) {
  return s.solved && s.hintsUsed === 0 && s.artistCorrect === true && s.yearCorrect === "exact";
}

function buildHints(song: DailyPuzzle[number], lyrics: Record<string, string>): [string, string] {
  return [lyrics[song.id] ? `"${lyrics[song.id]}"` : "", song.hints[1]];
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

function CheckIcon({ ok, warn }: { ok: boolean; warn?: boolean }) {
  const bg = warn ? "rgba(234,179,8,0.2)" : ok ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)";
  const color = warn ? "#eab308" : ok ? "#4ade80" : "#f87171";
  return (
    <div
      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold"
      style={{ background: bg, color }}
    >
      {ok || warn ? "✓" : "✗"}
    </div>
  );
}

function ScoreRow({ label, value, ok, pts, warn }: { label: string; value: string; ok: boolean; pts: number; warn?: boolean }) {
  const glow = warn ? "rgba(234,179,8,0.1)" : ok ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.08)";
  const border = warn ? "rgba(234,179,8,0.5)" : ok ? "rgba(34,197,94,0.45)" : "rgba(239,68,68,0.4)";
  const leak = warn
    ? "radial-gradient(ellipse at bottom right, rgba(234,179,8,0.15) 0%, transparent 70%)"
    : ok
    ? "radial-gradient(ellipse at bottom right, rgba(34,197,94,0.12) 0%, transparent 70%)"
    : "radial-gradient(ellipse at bottom right, rgba(239,68,68,0.1) 0%, transparent 70%)";
  return (
    <div
      className="relative flex items-center gap-3 px-4 py-3 rounded-xl overflow-hidden"
      style={{ background: glow, border: `1px solid ${border}` }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ background: leak }} />
      <div className="relative flex items-center gap-3 w-full">
      <CheckIcon ok={ok} warn={warn} />
      <div className="flex flex-col flex-1 min-w-0">
        <span className="text-[10px] uppercase tracking-widest text-[color:var(--color-muted)] leading-none mb-0.5">{label}</span>
        <span className="text-sm font-semibold text-white truncate">{value}</span>
      </div>
      <span className="text-sm font-bold shrink-0" style={{ color: warn ? "#eab308" : ok ? "#4ade80" : "rgba(255,255,255,0.3)" }}>
        {pts > 0 ? `+${pts}` : "—"}
      </span>
      </div>
    </div>
  );
}

export default function GameV2({
  puzzle, puzzleNumber, genreLabel, allArtists = [], lyrics = {},
}: {
  puzzle: DailyPuzzle;
  puzzleNumber?: number;
  genreLabel?: string;
  allArtists?: string[];
  lyrics?: Record<string, string>;
}) {
  const [songIndex, setSongIndex] = useState(0);
  const [states, setStates] = useState<SongState[]>(puzzle.map(init));
  const [gameOver, setGameOver] = useState(false);
  const [streak, setStreak] = useState(0);
  const [copied, setCopied] = useState(false);
  const [artistDropdownOpen, setArtistDropdownOpen] = useState(false);
  const [fullConfetti, setFullConfetti] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const streakRef = useRef(0);

  const current = puzzle[songIndex];
  const state = states[songIndex];

  const bonusComplete = state.bonusDone || (state.artistCorrect !== null && state.yearCorrect !== null);
  const runningTotal = states.reduce((sum, s) => sum + songTotal(s), 0);
  const starsEarned = states.filter(isPerfect).length;
  const genreColor = GENRE_HEX[current.genre ?? ""] ?? "#71717a";
  const decade = current.releaseYear ? `${Math.floor(parseInt(current.releaseYear) / 10) * 10}s` : "";
  const releaseYear = state.songInfo && state.songInfo !== "loading"
    ? state.songInfo.releaseYear
    : current.releaseYear ?? "";

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
    try {
      if (!localStorage.getItem("tunedecode_seen_how_to_play")) setShowHowToPlay(true);
    } catch {}
  }, []);

  useEffect(() => {
    if (!state.solved && !state.skipped) inputRef.current?.focus({ preventScroll: true });
  }, [songIndex, state.solved, state.skipped]);

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

  function update(index: number, patch: Partial<SongState>) {
    setStates((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  async function handleSubmit() {
    if (!state.guess.trim() || state.solved) return;
    const correct = validateGuess(state.guess, current.title, current.altTitles);
    if (correct) {
      const autoSkipArtist = state.hintsUsed >= 2;
      const autoSkipYear = false;
      update(songIndex, {
        solved: true, feedback: "", songInfo: "loading", glow: true, shake: false,
        ...(autoSkipArtist ? { artistCorrect: false } : {}),
        ...(autoSkipYear ? { yearCorrect: false as false } : {}),
      });
      setTimeout(() => update(songIndex, { glow: false }), 800);
      const info = await fetchSongInfo(current.title, current.artist);
      if (info && current.releaseYear) info.releaseYear = current.releaseYear;
      if (info && current.genre) info.genre = current.genre;
      update(songIndex, { songInfo: info });
    } else {
      const almost = isAlmostCorrect(state.guess, current.title, current.altTitles);
      update(songIndex, {
        feedback: almost ? randomFrom(ALMOST_MESSAGES) : randomFrom(WRONG_MESSAGES),
        feedbackWarm: almost, shake: true,
      });
      setTimeout(() => update(songIndex, { shake: false }), 500);
    }
  }

  function handleArtistSubmit() {
    if (!state.artistGuess.trim() || state.artistCorrect !== null) return;
    const correct = validateArtist(state.artistGuess, current.artist);
    update(songIndex, {
      artistCorrect: correct,
    });
  }

  function handleYearSubmit() {
    if (!state.yearGuess.trim() || state.yearCorrect !== null) return;
    const correct = validateYear(state.yearGuess, releaseYear);
    update(songIndex, { yearCorrect: correct });
  }

  function handleSkipBonus() {
    if (state.artistCorrect === null && state.hintsUsed < 2) {
      update(songIndex, { artistCorrect: false });
    } else {
      update(songIndex, {
        bonusDone: true,
        artistCorrect: state.artistCorrect ?? false,
        yearCorrect: state.yearCorrect ?? (false as false),
      });
    }
  }

  function handleHint() {
    if (state.hintsUsed >= 2 || state.solved) return;
    update(songIndex, { hintsUsed: state.hintsUsed + 1, feedback: "", feedbackWarm: false });
  }

  function handleReveal() {
    if (state.hintsUsed < 2) return;
    update(songIndex, { skipped: true, feedback: "" });
  }

  function handleNext() {
    const nextIdx = states.findIndex((s, i) => i > songIndex && !s.solved && !s.skipped);
    if (nextIdx !== -1) { setSongIndex(nextIdx); return; }
    setSongIndex((songIndex + 1) % puzzle.length);
  }

  function buildShareText() {
    const solvedCount = states.filter((s) => s.solved).length;
    const emojis = states.map((s) => (!s.solved ? "⬜" : s.hintsUsed === 0 ? "🟩" : "🟨")).join(" ");
    const stars = "★".repeat(starsEarned) + "☆".repeat(puzzle.length - starsEarned);
    const label = genreLabel ? genreLabel : `#${puzzleNumber}`;
    return `TuneTwist ${label}  ${solvedCount}/${puzzle.length}\n${runningTotal.toLocaleString()} / 5,000 pts\n${stars}\n\n${emojis}\n\ntunetwist.io`;
  }

  function handleCopy() {
    const text = buildShareText();
    const done = () => { setCopied(true); setTimeout(() => setCopied(false), 2000); };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done).catch(done);
    else done();
  }

  // ── Results screen ────────────────────────────────────────────────────
  if (gameOver) {
    const solvedCount = states.filter((s) => s.solved).length;
    return (
      <main className="flex flex-col items-center justify-start min-h-[100svh] px-4 pt-8 pb-6">
        <div className="w-full max-w-[480px] flex flex-col gap-5">
          <div className="text-center">
            <p className="text-3xl font-bold">{runningTotal.toLocaleString()} <span className="text-xl font-normal text-[color:var(--color-muted)]">/ 5,000</span></p>
            <p className="text-sm text-[color:var(--color-muted)] mt-1">{solvedCount}/{puzzle.length} solved · {starsEarned} perfect</p>
            {streak > 0 && <p className="text-sm text-white font-semibold mt-1">🔥 {streak}-day streak</p>}
          </div>

          <div className="text-3xl tracking-wide text-center" style={{ color: "#facc15" }}>
            {"★".repeat(starsEarned)}
            <span style={{ color: "rgba(255,255,255,0.15)" }}>{"★".repeat(puzzle.length - starsEarned)}</span>
          </div>

          <div className="text-center text-2xl tracking-widest">
            {states.map((s, i) => (
              <span key={i}>{!s.solved ? "⬜" : s.hintsUsed === 0 ? "🟩" : "🟨"}</span>
            ))}
          </div>

          <button
            onClick={handleCopy}
            className="w-full py-3.5 rounded-xl font-bold text-sm text-white hover:opacity-90 transition-opacity"
            style={{ background: "var(--btn-gradient)" }}
          >
            {copied ? "✓ Copied!" : "Copy Results"}
          </button>

          <div className="flex flex-col gap-2 bg-[color:var(--color-card)] border border-[color:var(--color-border)] rounded-2xl p-5">
            {puzzle.map((song, i) => {
              const s = states[i];
              const total = songTotal(s);
              return (
                <div key={song.id} className="flex items-center justify-between text-sm">
                  <span className={s.solved ? "text-white font-medium" : "text-[color:var(--color-muted)] line-through"}>
                    {song.title}
                  </span>
                  <span className={`font-semibold ${s.solved ? "text-[color:var(--color-green)]" : "text-[color:var(--color-muted)]"}`}>
                    {total > 0 ? `+${total}` : "—"}
                  </span>
                </div>
              );
            })}
          </div>

          <Countdown />
        </div>
      </main>
    );
  }

  // ── Game screen ───────────────────────────────────────────────────────
  const allDone = states.every((s) => s.solved || s.skipped);
  const hintCost = state.hintsUsed < 2
    ? TITLE_SCORES[state.hintsUsed] - TITLE_SCORES[state.hintsUsed + 1]
    : 0;

  return (
    <>
    <main className="relative flex flex-col items-center justify-start md:justify-center min-h-[100svh] md:min-h-[calc(100svh-8rem)] px-4 pt-[78px] md:pt-[88px] pb-6 overflow-x-hidden overflow-y-auto">

      {/* Scattered background music notes */}
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
            position: "absolute", left: el.x, top: el.y,
            fontSize: el.size, transform: `rotate(${el.rot}deg)`,
            color: "rgba(255,255,255,0.28)",
            animation: `dot-float ${3.5 + (i % 4) * 0.8}s ease-in-out ${i * 0.5}s infinite`,
            fontFamily: "serif",
          }}>{el.symbol}</span>
        ))}
      </div>

      <div className="relative z-10 w-full max-w-[560px] flex flex-col gap-4">

        {/* Card with glow blobs + gradient border */}
        <div className="relative w-full">
          <div className="absolute pointer-events-none" style={{ inset: "-120px", zIndex: 0 }}>
            <div style={{ position: "absolute", top: "0%", left: "-15%", width: "75%", height: "80%", background: "radial-gradient(ellipse at center, var(--blob-a-hi) 0%, var(--blob-a-lo) 45%, transparent 72%)", filter: "blur(50px)", animation: "blob-drift-a 12s ease-in-out infinite" }} />
            <div style={{ position: "absolute", bottom: "0%", right: "-12%", width: "72%", height: "78%", background: "radial-gradient(ellipse at center, var(--blob-b-hi) 0%, var(--blob-b-lo) 45%, transparent 72%)", filter: "blur(54px)", animation: "blob-drift-b 15s ease-in-out 2s infinite" }} />
            <div style={{ position: "absolute", top: "25%", right: "0%", width: "55%", height: "60%", background: "radial-gradient(ellipse at center, var(--blob-c-hi) 0%, var(--blob-c-lo) 45%, transparent 72%)", filter: "blur(46px)", animation: "blob-drift-c 18s ease-in-out 5s infinite" }} />
          </div>
          <div className="relative z-10 w-full p-[2px] rounded-3xl" style={{ background: `linear-gradient(135deg, ${genreColor}99 0%, var(--color-purple) 40%, var(--color-coral) 70%, ${genreColor}44 100%)` }}>
        <div
          className={`relative w-full bg-[color:var(--color-card)] rounded-[22px] overflow-hidden flex flex-col ${state.shake ? "animate-shake" : ""} ${state.glow ? "animate-glow" : ""}`}
        >
          {state.glow && (
            <div className="absolute top-1/3 left-1/2 pointer-events-none" aria-hidden="true">
              {CONFETTI_PARTICLES.map((p) => (
                <span key={p.idx} style={{ position: "absolute", width: 7, height: 7, borderRadius: "50%", background: p.color, animation: `confetti-${p.idx} 0.75s ease-out ${p.delay}ms forwards` }} />
              ))}
            </div>
          )}
          {/* Card header */}
          {bonusComplete ? (
            <div className="px-5 pt-4 pb-3 flex items-center gap-4">
              {state.songInfo === "loading" ? (
                <div className="w-[88px] h-[88px] rounded-xl shrink-0" style={{ background: "rgba(255,255,255,0.08)", animation: "pulse 1.5s ease-in-out infinite" }} />
              ) : state.songInfo?.artworkUrl ? (
                <Image
                  src={state.songInfo.artworkUrl}
                  alt={current.title}
                  width={88}
                  height={88}
                  className="rounded-xl shadow-lg shrink-0"
                  style={{ objectFit: "cover" }}
                />
              ) : (
                <div className="w-[88px] h-[88px] rounded-xl shrink-0" style={{ background: "rgba(255,255,255,0.06)" }} />
              )}
              <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                <p className="text-xl font-bold leading-tight" style={{ fontFamily: "var(--font-poppins)" }}>
                  {current.title}
                </p>
                <p className="text-sm text-[color:var(--color-muted)]">{current.artist} · {releaseYear}</p>
                {!state.skipped && isPerfect(state) && (
                  <span
                    className="text-xs font-bold px-3 py-1 rounded-full mt-1 self-start"
                    style={{
                      background: "linear-gradient(135deg, rgba(234,179,8,0.25) 0%, rgba(251,191,36,0.15) 50%, rgba(217,119,6,0.2) 100%)",
                      color: "#fbbf24",
                      border: "1px solid rgba(251,191,36,0.5)",
                      boxShadow: "0 0 12px rgba(251,191,36,0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
                      textShadow: "0 0 8px rgba(251,191,36,0.6)",
                    }}
                  >
                    ★ Perfect song
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="px-5 pt-4 pb-3 flex flex-col items-center text-center gap-1.5">
              <span
                className="text-xs font-bold px-3 py-0.5 rounded-full"
                style={{ background: `${genreColor}22`, color: genreColor, border: `1px solid ${genreColor}55` }}
              >
                {current.genre ?? "Unknown"} · {decade}
              </span>

              <p className="text-2xl font-bold leading-tight" style={{ fontFamily: "var(--font-poppins)" }}>
                {state.solved || state.skipped ? current.title : stripFeaturing(current.synonymTitle)}
              </p>

              {state.skipped && (
                <p className="text-sm text-[color:var(--color-muted)]">{current.artist} · {releaseYear}</p>
              )}
            </div>
          )}

          <div className="h-px mx-5" style={{ background: "rgba(255,255,255,0.07)" }} />

          {/* Hints */}
          {state.hintsUsed > 0 && !bonusComplete && !state.skipped && (
            <div className="px-5 pt-4 flex flex-col gap-1.5">
              {buildHints(current, lyrics).slice(0, state.hintsUsed).map((hint, hi) => (
                <div key={hi} className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg"
                  style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.3)", color: "#c084fc" }}>
                  <span className="opacity-60 text-xs">Hint {hi + 1}</span>
                  <span>{hint}</span>
                </div>
              ))}
            </div>
          )}

          {/* Content area */}
          <div className="flex flex-col px-5 pt-3 pb-5 gap-2">

            {/* Result rows */}
            <div className="flex flex-col gap-2">
              {state.skipped && (
                <ScoreRow label="Title" value={`${current.title} — skipped`} ok={false} pts={0} />
              )}
              {state.solved && (
                <ScoreRow label="Title" value={current.title} ok={true} pts={titlePts(state)} />
              )}
              {state.solved && state.artistCorrect !== null && (
                <ScoreRow label="Artist" value={current.artist} ok={state.artistCorrect === true} pts={artistPts(state)} />
              )}
              {state.solved && state.yearCorrect !== null && (
                <ScoreRow
                  label="Year"
                  value={releaseYear}
                  ok={state.yearCorrect === "exact"}
                  warn={state.yearCorrect === "close"}
                  pts={yearPts(state)}
                />
              )}
              {bonusComplete && (
                <div
                  className="flex items-center justify-between px-4 py-3 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-[color:var(--color-muted)] mb-0.5">This Song</p>
                    <p className="text-xl font-bold" style={{ color: "#4ade80" }}>+{songTotal(state).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-widest text-[color:var(--color-muted)] mb-0.5">Running Total</p>
                    <p className="text-xl font-bold text-white">{runningTotal.toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Active input zone — single persistent input so iOS keyboard never dismisses */}
            <div className="flex flex-col gap-2">
              {(() => {
                const step =
                  state.skipped || bonusComplete ? "done"
                  : !state.solved ? "title"
                  : state.artistCorrect === null ? "artist"
                  : state.yearCorrect === null ? "year"
                  : "done";

                if (step === "done") {
                  return (
                    <button
                      onClick={allDone ? () => setGameOver(true) : handleNext}
                      className="w-full py-3.5 rounded-xl font-bold text-sm text-white hover:opacity-90 transition-opacity"
                      style={{ background: "var(--btn-gradient)" }}
                    >
                      {allDone ? "See Results →" : "Next Song →"}
                    </button>
                  );
                }

                const inputValue =
                  step === "title" ? state.guess
                  : step === "artist" ? state.artistGuess
                  : state.yearGuess;

                const placeholder =
                  step === "title" ? "Name that track…"
                  : step === "artist" ? "Who's the artist?"
                  : "What year was it released?";

                const submitLabel =
                  step === "title" ? "Submit"
                  : step === "artist" ? "Submit Artist"
                  : "Submit Year";

                function handleChange(val: string) {
                  if (step === "title") update(songIndex, { guess: val, feedback: "" });
                  else if (step === "artist") { update(songIndex, { artistGuess: val }); setArtistDropdownOpen(true); }
                  else update(songIndex, { yearGuess: val });
                }

                function handleUnifiedSubmit() {
                  if (step === "title") handleSubmit();
                  else if (step === "artist") handleArtistSubmit();
                  else handleYearSubmit();
                }

                const artistMatches =
                  step === "artist" && artistDropdownOpen && state.artistGuess.trim().length > 0
                    ? allArtists.filter((a) => a.toLowerCase().includes(state.artistGuess.toLowerCase())).slice(0, 8)
                    : [];

                return (
                  <>
                    <div className="relative">
                      <form onSubmit={(e) => { e.preventDefault(); handleUnifiedSubmit(); }}>
                        <div className="gradient-border w-full">
                          <input
                            ref={inputRef}
                            type="text"
                            inputMode={step === "year" ? "numeric" : "text"}
                            enterKeyHint="next"
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck={false}
                            value={inputValue}
                            onChange={(e) => handleChange(e.target.value)}
                            onFocus={() => { if (step === "artist") setArtistDropdownOpen(true); }}
                            onBlur={() => { if (step === "artist") setTimeout(() => setArtistDropdownOpen(false), 150); }}
                            placeholder={placeholder}
                            className="w-full bg-[color:var(--color-navy)] rounded-[11px] px-4 py-3 text-base text-white placeholder:text-[color:var(--color-muted)] outline-none"
                          />
                        </div>
                      </form>
                      {artistMatches.length > 0 && (
                        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-[color:var(--color-navy)] border border-[color:var(--color-border)] rounded-xl overflow-y-auto shadow-xl" style={{ maxHeight: 192 }}>
                          {artistMatches.map((a) => (
                            <button key={a}
                              onMouseDown={() => { setArtistDropdownOpen(false); update(songIndex, { artistGuess: a, artistCorrect: validateArtist(a, current.artist) }); }}
                              className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                            >{a}</button>
                          ))}
                        </div>
                      )}
                    </div>

                    {step === "title" && state.feedback && (
                      <p className={`text-sm ${state.feedbackWarm ? "text-[color:var(--color-coral)]" : "text-[color:var(--color-red)]"}`}>
                        {state.feedback}
                      </p>
                    )}

                    <button
                      onPointerDown={(e) => e.preventDefault()}
                      onClick={handleUnifiedSubmit}
                      className="w-full py-3 rounded-xl font-bold text-sm text-white hover:opacity-90 transition-opacity"
                      style={{ background: "var(--btn-gradient)" }}
                    >
                      {submitLabel}
                    </button>

                    {step === "title" && (
                      <div className="flex gap-2">
                        <button
                          onPointerDown={(e) => e.preventDefault()}
                          onClick={handleHint}
                          disabled={state.hintsUsed >= 3}
                          className="flex-1 py-2 rounded-xl border border-[color:var(--color-border)] text-[color:var(--color-muted)] hover:text-[color:var(--color-purple)] hover:border-[color:var(--color-purple)] disabled:opacity-30 transition-colors text-sm font-semibold"
                        >
                          <span className="flex items-center justify-center gap-1.5">
                            <Lightbulb size={14} />
                            {state.hintsUsed < 2 ? `Hint ${state.hintsUsed + 1} (−${hintCost} pts)` : "2/2 hints used"}
                          </span>
                        </button>
                        <button
                          onPointerDown={(e) => e.preventDefault()}
                          onClick={handleReveal}
                          disabled={state.hintsUsed < 3}
                          className="flex-1 py-2 rounded-xl border border-white/20 text-white/60 hover:text-[color:var(--color-coral)] hover:border-[color:var(--color-coral)] disabled:opacity-50 transition-colors text-sm font-semibold"
                        >
                          Reveal
                        </button>
                      </div>
                    )}

                    {(step === "artist" || step === "year") && (
                      <button onPointerDown={(e) => e.preventDefault()} onClick={handleSkipBonus} className="text-xs text-[color:var(--color-muted)] hover:text-white transition-colors text-left">
                        Skip →
                      </button>
                    )}

                  </>
                );
              })()}
            </div>
            <p className="text-xs text-center text-[color:var(--color-muted)] uppercase tracking-widest pt-1">
              Song {songIndex + 1} of {puzzle.length}
            </p>
          </div>
        </div>
          </div>
        </div>

        {/* See Results */}
        {states.every((s) => s.solved || s.skipped) && (
          <button
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => setGameOver(true)}
            className="w-full py-3.5 rounded-xl border border-[color:var(--color-purple)] text-[color:var(--color-purple)] text-sm font-bold hover:bg-[color:var(--color-purple)]/10 transition-colors"
          >
            See Results →
          </button>
        )}

      </div>

      {/* Full-screen confetti */}
      {fullConfetti && (
        <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden" aria-hidden="true">
          {confettiPieces.map((p) => (
            <div key={p.id} style={{
              position: "absolute", left: `${p.left}%`, top: "-12px",
              width: p.size, height: p.size,
              borderRadius: p.round ? "50%" : "2px",
              background: p.color,
              animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s forwards`,
            }} />
          ))}
        </div>
      )}
    </main>
    {showHowToPlay && (
      <HowToPlayModal
        onClose={() => setShowHowToPlay(false)}
        onDontShowAgain={() => {
          try { localStorage.setItem("tunedecode_seen_how_to_play", "1"); } catch {}
          setShowHowToPlay(false);
        }}
      />
    )}
    </>
  );
}
