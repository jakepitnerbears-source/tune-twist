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

// Jukebox neon palette
const CHROME_GRAD = "linear-gradient(135deg, #d0d0d0 0%, #707070 30%, #b8b8b8 55%, #585858 80%, #c0c0c0 100%)";
const AMBER = "#ffb800";
const JUKE_BG = "#080808";
const JUKE_PANEL = "#0f0f0f";

function randomFrom(arr: string[]): string { return arr[Math.floor(Math.random() * arr.length)]; }

function stripFeaturing(title: string): string {
  return title
    .replace(/\s*\(feat\..*?\)/gi, "").replace(/\s*\(ft\..*?\)/gi, "")
    .replace(/\s*\(featuring.*?\)/gi, "").replace(/\s*feat\..*$/gi, "")
    .replace(/\s*FEAT\..*$/g, "").trim();
}

const NUMBER_ONES: Record<string, number> = { zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,seventeen:17,eighteen:18,nineteen:19 };
const NUMBER_TENS: Record<string, number> = { twenty:20,thirty:30,forty:40,fifty:50,sixty:60,seventy:70,eighty:80,ninety:90 };

function collapseNumbers(str: string): string {
  let s = str.toLowerCase().replace(/-/g, " ");
  s = s.replace(/\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)\s+(one|two|three|four|five|six|seven|eight|nine)\b/g, (_,t,o) => String(NUMBER_TENS[t]+NUMBER_ONES[o]));
  s = s.replace(/\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)\b/g, (_,t) => String(NUMBER_TENS[t]));
  s = s.replace(/\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen)\b/g, (_,o) => String(NUMBER_ONES[o]));
  return s;
}
function normalizeArtist(str: string): string { return collapseNumbers(str).replace(/[^a-z0-9\s]/g, "").trim(); }
function validateArtist(guess: string, correct: string): boolean {
  const g = normalizeArtist(guess), c = normalizeArtist(correct);
  return g === c || c.includes(g) || g.includes(c);
}
function validateYear(guess: string, correct: string): "exact" | "close" | false {
  const g = parseInt(guess.trim(), 10), c = parseInt(correct, 10);
  if (isNaN(g)) return false;
  if (g === c) return "exact";
  if (Math.abs(g - c) === 1) return "close";
  return false;
}
function titleScore(hintsUsed: number, solved: boolean): number {
  if (!solved) return 0;
  return Math.max(100, BASE_SCORE - HINT_COSTS.slice(0, hintsUsed).reduce((a, b) => a + b, 0));
}
function totalSongScore(s: SongState): number {
  return titleScore(s.hintsUsed, s.solved) + (s.artistCorrect ? ARTIST_BONUS : 0) +
    (s.yearCorrect === "exact" ? YEAR_BONUS : s.yearCorrect === "close" ? YEAR_BONUS_CLOSE : 0);
}
function starRating(score: number, maxScore: number): number {
  const p = score / maxScore;
  if (p >= 0.9) return 5; if (p >= 0.7) return 4; if (p >= 0.5) return 3; if (p >= 0.2) return 2; if (p > 0) return 1; return 0;
}
function getToday(): string { return new Date().toISOString().split("T")[0]; }
function getYesterday(): string { const d = new Date(); d.setDate(d.getDate()-1); return d.toISOString().split("T")[0]; }
function formatCountdown(): string {
  const now = new Date(), next = new Date(); next.setUTCHours(24,0,0,0);
  const diff = next.getTime() - now.getTime();
  if (diff<=0) return "00:00:00";
  const h=Math.floor(diff/3600000), m=Math.floor((diff%3600000)/60000), s=Math.floor((diff%60000)/1000);
  return `${h}:${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;
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
  return { hintsUsed:0,solved:false,skipped:false,guess:"",feedback:"",feedbackWarm:false,shake:false,glow:false,songInfo:null,bonusDone:false,artistGuess:"",artistCorrect:null,artistFeedback:"",yearGuess:"",yearCorrect:null,yearFeedback:"" };
}

function Check({ className="" }: { className?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`inline-block shrink-0 ${className}`} style={{verticalAlign:"middle",marginTop:"-1px"}}>
      <polyline points="1.5,6.5 4.5,9.5 10.5,2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function Countdown() {
  const [time, setTime] = useState(formatCountdown());
  useEffect(() => { const id = setInterval(()=>setTime(formatCountdown()),1000); return ()=>clearInterval(id); }, []);
  return (
    <div className="text-center flex flex-col gap-1">
      <p className="text-xs uppercase tracking-widest" style={{color: `${AMBER}88`}}>Next puzzle in</p>
      <p className="text-xl font-bold tabular-nums" style={{color: AMBER, textShadow:`0 0 12px ${AMBER}66`}}>{time}</p>
    </div>
  );
}

// Jukebox selector button
function JukeButton({ onClick, disabled, indicatorColor, topLabel, bottomLabel, large=false }: {
  onClick: () => void; disabled?: boolean;
  indicatorColor: string; topLabel: string; bottomLabel: string; large?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center gap-1.5 transition-all active:scale-95 disabled:opacity-30"
      style={{
        background: `linear-gradient(to bottom, #141414 0%, #0c0c0c 100%)`,
        border: `1px solid #282828`,
        borderRadius: large ? 16 : 12,
        padding: large ? "14px 28px" : "10px 20px",
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.07), 0 4px 12px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,0,0,0.4)`,
        minWidth: large ? 120 : 80,
        cursor: disabled ? "default" : "pointer",
      }}
    >
      {/* Indicator light */}
      <div style={{
        width: large ? 10 : 8,
        height: large ? 10 : 8,
        borderRadius: "50%",
        background: disabled ? "#1e1e1e" : indicatorColor,
        boxShadow: disabled ? "none" : `0 0 10px ${indicatorColor}, 0 0 24px ${indicatorColor}88, 0 0 40px ${indicatorColor}33`,
      }} />
      <span style={{
        fontSize: large ? 13 : 11,
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: disabled ? "#3a3a3a" : "#e8e8e8",
        textShadow: disabled ? "none" : `0 0 10px rgba(255,255,255,0.2)`,
      }}>{topLabel}</span>
      <span style={{
        fontSize: 9,
        letterSpacing: "0.08em",
        color: disabled ? "#282828" : "#666666",
        textTransform: "uppercase",
      }}>{bottomLabel}</span>
    </button>
  );
}

export default function GameJukebox({ puzzle, puzzleNumber, genreLabel, allArtists=[], previewUrls=[] }: {
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
  const decade = current.releaseYear ? `${Math.floor(parseInt(current.releaseYear)/10)*10}s` : "";

  useEffect(() => {
    try {
      const stored = localStorage.getItem("tunedecode_streak");
      if (stored) {
        const data = JSON.parse(stored) as { lastPlayed: string; streak: number };
        if (data.lastPlayed===getToday()||data.lastPlayed===getYesterday()) { streakRef.current=data.streak; setStreak(data.streak); }
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!gameOver) return;
    const solved = states.filter(s=>s.solved).length;
    const newStreak = solved>=3 ? streakRef.current+1 : 0;
    streakRef.current=newStreak; setStreak(newStreak);
    try { localStorage.setItem("tunedecode_streak",JSON.stringify({lastPlayed:getToday(),streak:newStreak})); } catch {}
  }, [gameOver]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const s = states[songIndex];
    if (s.solved && s.artistCorrect===true && s.yearCorrect==="exact") {
      setFullConfetti(true);
      const t = setTimeout(()=>setFullConfetti(false),3000);
      return ()=>clearTimeout(t);
    }
  }, [songIndex, states[songIndex]?.artistCorrect, states[songIndex]?.yearCorrect]); // eslint-disable-line react-hooks/exhaustive-deps

  const confettiPieces = useMemo(() => {
    if (!fullConfetti) return [];
    const colors=["#00b4ff","#7b61ff","#ff6b3d","#ffffff","#ffd700"];
    return Array.from({length:80},(_,i)=>({
      id:i,left:Math.random()*100,size:6+Math.random()*7,round:Math.random()>0.5,
      color:colors[Math.floor(Math.random()*colors.length)],duration:1.8+Math.random()*1.8,delay:Math.random()*1.0,
    }));
  }, [fullConfetti]);

  useEffect(() => { if (!state.solved&&!state.skipped) inputRef.current?.focus(); }, [songIndex,state.solved,state.skipped]);
  useEffect(() => { if (state.solved&&!state.bonusDone&&state.artistCorrect===null) artistRef.current?.focus(); }, [state.solved,state.bonusDone,state.artistCorrect]);

  function updateState(index: number, patch: Partial<SongState>) {
    setStates(prev=>prev.map((s,i)=>i===index?{...s,...patch}:s));
  }

  async function handleSubmit() {
    if (!state.guess.trim()||state.solved) return;
    if (validateGuess(state.guess, current.title, current.altTitles)) {
      const autoSkipArtist = state.hintsUsed>=3, autoSkipYear = state.hintsUsed>=2;
      updateState(songIndex, {
        solved:true,feedback:randomFrom(CORRECT_MESSAGES),songInfo:"loading",glow:true,shake:false,
        ...(autoSkipArtist?{artistCorrect:false}:{}),
        ...(autoSkipYear?{yearCorrect:false as false}:{}),
      });
      setTimeout(()=>updateState(songIndex,{glow:false}),1000);
      const info = await fetchSongInfo(current.title,current.artist);
      if (info&&current.releaseYear) info.releaseYear=current.releaseYear;
      updateState(songIndex,{songInfo:info});
    } else {
      const almost = isAlmostCorrect(state.guess,current.title);
      updateState(songIndex,{feedback:almost?randomFrom(ALMOST_MESSAGES):randomFrom(WRONG_MESSAGES),feedbackWarm:almost,shake:true});
      setTimeout(()=>updateState(songIndex,{shake:false}),500);
    }
  }

  function handleArtistSubmit() {
    if (!state.artistGuess.trim()||state.artistCorrect!==null) return;
    const correct = validateArtist(state.artistGuess,current.artist);
    updateState(songIndex,{artistCorrect:correct,artistFeedback:correct?randomFrom(["+150. You know your stuff.","Artist locked in."]):randomFrom(["Not quite. Try again.","Close?"])});
  }

  function handleYearSubmit() {
    if (!state.yearGuess.trim()||state.yearCorrect!==null) return;
    const releaseYear = state.songInfo&&state.songInfo!=="loading"?state.songInfo.releaseYear:current.releaseYear??"";
    const correct = validateYear(state.yearGuess,releaseYear);
    updateState(songIndex,{yearCorrect:correct,yearFeedback:correct==="exact"?randomFrom(["+100. Dialed in.","Year on point."]):correct==="close"?randomFrom(["+50. One year off.","Close — within a year."]):randomFrom(["Wrong year. Guess again.","Off by more than one."])});
  }

  function stopPreview() {
    if (audioTimerRef.current) clearTimeout(audioTimerRef.current);
    audioRef.current?.pause(); audioRef.current=null; setPlayingPreview(false);
  }
  useEffect(()=>{stopPreview();},[songIndex]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(()=>()=>{stopPreview();},[]);       // eslint-disable-line react-hooks/exhaustive-deps

  function togglePreview() {
    const url=previewUrls[songIndex]; if (!url) return;
    if (playingPreview){stopPreview();return;}
    stopPreview();
    const audio=new Audio(url); audioRef.current=audio;
    audio.play(); audio.onended=()=>setPlayingPreview(false);
    audioTimerRef.current=setTimeout(stopPreview,3000); setPlayingPreview(true);
  }

  function handleSkipBonus() {
    updateState(songIndex,{bonusDone:true,artistCorrect:state.artistCorrect??false,yearCorrect:state.yearCorrect??false as false});
  }
  function handleHint() {
    if (state.hintsUsed>=current.hints.length||state.solved) return;
    updateState(songIndex,{hintsUsed:state.hintsUsed+1,feedback:randomFrom(HINT_MESSAGES),feedbackWarm:false});
  }
  function handleReveal() {
    if (state.hintsUsed<current.hints.length) return;
    updateState(songIndex,{skipped:true,feedback:randomFrom(SKIP_MESSAGES)});
  }
  function handleNext() {
    if (songIndex<puzzle.length-1) setSongIndex(songIndex+1); else setGameOver(true);
  }

  function buildShareText(score: number): string {
    const solvedCount=states.filter(s=>s.solved).length;
    const stars=starRating(score,maxScore);
    const starEmojis="⭐".repeat(stars)+"☆".repeat(5-stars);
    const emojis=states.map(s=>(!s.solved?"⬜":s.hintsUsed===0?"🟩":"🟨")).join(" ");
    const label=genreLabel?genreLabel:`#${puzzleNumber}`;
    return `TuneTwist ${label}  ${solvedCount}/${puzzle.length}\n${starEmojis}\n\n${emojis}\n\ntunetwist.io`;
  }
  function handleCopyResults(score: number) {
    navigator.clipboard.writeText(buildShareText(score)).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);});
  }

  const bonusComplete = state.bonusDone||(state.artistCorrect!==null&&state.yearCorrect!==null);
  const totalScore = states.reduce((sum,s)=>sum+totalSongScore(s),0);
  const maxScore = puzzle.length*MAX_SONG_SCORE;

  // ── Results screen ─────────────────────────────────────────────────────────
  if (gameOver) {
    const stars=starRating(totalScore,maxScore), solvedCount=states.filter(s=>s.solved).length;
    return (
      <main className="flex flex-col items-center justify-center min-h-[calc(100svh-8rem)] px-4 py-6" style={{background: JUKE_BG}}>
        <div className="w-full max-w-[520px] flex flex-col gap-6">
          <div className="text-center">
            <div className="flex justify-center mb-2"><Image src="/logo.png" alt="TitleTwist" width={220} height={110} className="object-contain"/></div>
            {streak>0&&<p className="text-sm mt-1" style={{color:`${AMBER}88`}}>🔥 {streak}-day streak</p>}
          </div>
          <div className="rounded-2xl px-6 py-5" style={{background:JUKE_PANEL,border:`1px solid #1e1e1e`}}>
            <p className="text-xs uppercase tracking-widest text-center mb-3" style={{color:`${AMBER}88`}}>Share Preview</p>
            <pre className="text-sm text-center whitespace-pre font-mono leading-relaxed" style={{color:AMBER}}>{buildShareText(totalScore)}</pre>
          </div>
          <button onClick={()=>handleCopyResults(totalScore)} className="w-full py-3.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity" style={{background:`linear-gradient(135deg, #ffb800 0%, #ff8c00 100%)`,color:"#080808"}}>
            {copied?<><Check/> Copied!</>:"Copy Results"}
          </button>
          <div className="rounded-2xl p-8 flex flex-col gap-5" style={{background:JUKE_PANEL,border:`1px solid #1e1e1e`}}>
            <p className="text-xs uppercase tracking-widest text-center" style={{color:`${AMBER}88`}}>{genreLabel?genreLabel:`Today's Results — #${puzzleNumber}`}</p>
            <div className="flex justify-center"><StarRating stars={stars} size={28}/></div>
            <p className="text-3xl font-bold text-center" style={{color:AMBER,textShadow:`0 0 20px ${AMBER}66`}}>{totalScore.toLocaleString()} pts</p>
            <p className="text-sm text-center" style={{color:`${AMBER}66`}}>{solvedCount} of {puzzle.length} songs decoded</p>
            <div className="text-center text-2xl tracking-widest">{states.map((s,i)=>(<span key={i}>{!s.solved?"⬜":s.hintsUsed===0?"🟩":"🟨"}</span>))}</div>
            <div className="flex flex-col gap-3 mt-1">
              {puzzle.map((song,i)=>{
                const s=states[i];
                return (
                  <div key={song.id} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className={s.solved?"font-semibold":"line-through"} style={{color:s.solved?"#d0d0d0":"#555555"}}>{song.title}</span>
                      <span className="font-semibold" style={{color:s.solved?"#00b4ff":"#555555"}}>{totalSongScore(s)} pts</span>
                    </div>
                    {s.solved&&(<div className="flex gap-2 text-xs">
                      <span style={{color:s.artistCorrect?"#00b4ff":"#ef4444"}}>{s.artistCorrect?<><Check/> Artist</>:"✕ Artist"}</span>
                      <span style={{color:s.yearCorrect==="exact"?"#00b4ff":s.yearCorrect==="close"?"#facc15":"#ef4444"}}>{s.yearCorrect==="exact"?<><Check/> Year</>:s.yearCorrect==="close"?"~ Year":"✕ Year"}</span>
                    </div>)}
                    {s.solved&&s.songInfo&&s.songInfo!=="loading"&&<SongReveal info={s.songInfo as SongInfo}/>}
                  </div>
                );
              })}
            </div>
          </div>
          <Countdown/>
        </div>
      </main>
    );
  }

  // ── Game screen ────────────────────────────────────────────────────────────
  return (
    <main
      className="relative flex flex-col items-center justify-center min-h-[calc(100svh-8rem)] px-4 py-6 overflow-hidden"
      style={{ background: `radial-gradient(ellipse at 50% 30%, #1a1a1a 0%, ${JUKE_BG} 70%)` }}
    >
      <div className="relative z-10 w-full max-w-[520px] flex flex-col gap-5">

        {/* Logo */}
        <div className="flex justify-center">
          <Image src="/logo.png" alt="TitleTwist" width={160} height={80} className="object-contain"/>
        </div>

        {/* Dot tracker */}
        <div className="flex justify-center gap-2">
          {puzzle.map((_,i)=>{
            const s=states[i], isDone=s.solved||s.skipped, isActive=i===songIndex;
            return (
              <button key={i} onClick={()=>isDone?setSongIndex(i):undefined} disabled={!isDone&&!isActive}
                className="transition-all rounded-full"
                style={{
                  width: isActive?16:10, height:10,
                  background: isActive?"#d0d0d0":isDone&&s.solved?"#00b4ff":isDone?"#ef4444":"#1e1e1e",
                }}
              />
            );
          })}
        </div>

        {/* ── Jukebox body ── */}
        {/* Chrome outer ring */}
        <div style={{ background: CHROME_GRAD, padding: "3px", borderRadius: 28, boxShadow: "0 8px 40px rgba(0,0,0,0.8), 0 0 0 1px rgba(0,0,0,0.5)" }}>
        {/* Dark body */}
        <div
          className={`relative overflow-hidden ${state.shake?"animate-shake":""} ${state.glow?"animate-glow":""}`}
          style={{ background: JUKE_BG, borderRadius: 26 }}
        >

          {/* Confetti */}
          {state.glow&&(
            <div className="absolute top-1/3 left-1/2 pointer-events-none z-20" aria-hidden="true">
              {[{idx:0,color:"#00b4ff",delay:0},{idx:1,color:"#7b61ff",delay:30},{idx:2,color:"#00b4ff",delay:60},{idx:3,color:"#ff6b3d",delay:20},{idx:4,color:"#7b61ff",delay:50},{idx:5,color:"#00b4ff",delay:40},{idx:6,color:"#ff6b3d",delay:10},{idx:7,color:"#7b61ff",delay:70},{idx:8,color:"#00b4ff",delay:15},{idx:9,color:"#ff6b3d",delay:55}].map(p=>(
                <span key={p.idx} style={{position:"absolute",width:7,height:7,borderRadius:"50%",background:p.color,animation:`confetti-${p.idx} 0.75s ease-out ${p.delay}ms forwards`}}/>
              ))}
            </div>
          )}

          {/* ── Top chrome band ── */}
          <div style={{ background: "linear-gradient(to bottom, #181818 0%, #111111 100%)", borderBottom: "1px solid #282828", padding: "10px 20px" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Decorative neon dots */}
                {["#ff3d7a","#ffb800","#00d4d4","#7b61ff","#00b4ff"].map((c,i)=>(
                  <div key={i} style={{width:9,height:9,borderRadius:"50%",background:c,boxShadow:`0 0 10px ${c}, 0 0 20px ${c}66`}}/>
                ))}
              </div>
              <p style={{fontSize:10,letterSpacing:"0.2em",color:"#666666",textTransform:"uppercase",fontWeight:700}}>
                {state.solved?"Identified":state.skipped?"Skipped":"Now Playing"} · {songIndex+1}/{puzzle.length}
              </p>
              <div style={{
                fontSize:10,letterSpacing:"0.15em",color:`${AMBER}99`,fontWeight:700,
                textTransform:"uppercase",
                textShadow:`0 0 6px ${AMBER}44`,
              }}>
                {current.genre ?? ""}
              </div>
            </div>
          </div>

          {/* ── Vinyl window ── */}
          <div className="flex justify-center items-center py-6" style={{ background: `linear-gradient(to bottom, #141414 0%, #080808 100%)` }}>
            {/* Chrome bezel ring */}
            <div
              style={{
                background: CHROME_GRAD,
                padding: 5,
                borderRadius: "50%",
                boxShadow: "0 4px 20px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1)",
              }}
            >
              {/* Inner dark glass */}
              <div
                style={{
                  width: 200, height: 200,
                  borderRadius: "50%",
                  background: "#060606",
                  overflow: "hidden",
                  position: "relative",
                  boxShadow: "inset 0 2px 8px rgba(0,0,0,0.8)",
                  cursor: previewUrls[songIndex]&&!state.solved&&!state.skipped ? "pointer" : "default",
                }}
                onClick={previewUrls[songIndex]&&!state.solved&&!state.skipped ? togglePreview : undefined}
              >
                {/* Vinyl record */}
                <div style={{
                  position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",
                }}>
                  <div style={{
                    width:176,height:176,borderRadius:"50%",position:"relative",
                    background:`conic-gradient(from 0deg, #080808 0%, ${genreColor}55 20%, #080808 38%, ${genreColor}33 55%, #080808 72%, ${genreColor}22 88%, #080808 100%)`,
                    boxShadow:`0 0 40px ${genreColor}22`,
                    border:"1px solid rgba(255,255,255,0.04)",
                    animation:"vinyl-spin 5s linear infinite",
                    animationPlayState: playingPreview?"running":"paused",
                  }}>
                    {/* Groove rings */}
                    <div style={{position:"absolute",inset:"12%",borderRadius:"50%",border:"1px solid rgba(255,255,255,0.03)"}}/>
                    <div style={{position:"absolute",inset:"25%",borderRadius:"50%",border:"1px solid rgba(255,255,255,0.03)"}}/>
                    <div style={{position:"absolute",inset:"38%",borderRadius:"50%",border:"1px solid rgba(255,255,255,0.03)"}}/>
                    {/* Label */}
                    <div style={{
                      position:"absolute",inset:"35%",borderRadius:"50%",
                      background:`radial-gradient(circle, ${genreColor}44 0%, ${genreColor}22 60%, #080808 100%)`,
                      display:"flex",alignItems:"center",justifyContent:"center",
                      border:`1px solid ${genreColor}33`,
                    }}>
                      {/* Center spindle */}
                      <div style={{width:8,height:8,borderRadius:"50%",background:"#080808",border:"1px solid rgba(255,255,255,0.2)"}}/>
                    </div>
                  </div>
                </div>

                {/* Glass reflection */}
                <div style={{
                  position:"absolute",inset:0,borderRadius:"50%",
                  background:"linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%)",
                  pointerEvents:"none",
                }}/>

                {/* Solved overlay */}
                {state.solved&&(
                  <div style={{position:"absolute",inset:0,borderRadius:"50%",background:`${genreColor}18`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none"><polyline points="6,21 16,31 34,9" stroke="#00b4ff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                )}
                {state.skipped&&(
                  <div style={{position:"absolute",inset:0,borderRadius:"50%",background:"rgba(239,68,68,0.15)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <span style={{fontSize:32,fontWeight:700,color:"#ef4444"}}>✕</span>
                  </div>
                )}

                {/* Play hover */}
                {previewUrls[songIndex]&&!state.solved&&!state.skipped&&(
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity" style={{borderRadius:"50%",background:"rgba(0,0,0,0.4)"}}>
                    <span style={{fontSize:28,color:"rgba(255,255,255,0.9)"}}>{playingPreview?"⏸":"▶"}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Amber reader board — song title ── */}
          <div style={{
            background:"linear-gradient(to bottom, #0a0a0a 0%, #080808 100%)",
            borderTop:"1px solid #222222",
            borderBottom:"1px solid #222222",
            padding:"14px 24px 12px",
            position:"relative",
            overflow:"hidden",
          }}>
            {/* Scanline texture */}
            <div style={{
              position:"absolute",inset:0,
              backgroundImage:"repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.15) 3px, rgba(0,0,0,0.15) 4px)",
              pointerEvents:"none",
            }}/>
            <p
              className="relative z-10"
              style={{
                fontFamily:"var(--font-poppins)",
                fontWeight:600,
                fontSize:"clamp(1.4rem, 4.5vw, 2rem)",
                lineHeight:1.15,
                color: AMBER,
                textShadow:`0 0 20px ${AMBER}, 0 0 40px ${AMBER}66, 0 0 80px ${AMBER}33`,
                display:"-webkit-box",
                WebkitLineClamp:2,
                WebkitBoxOrient:"vertical",
                overflow:"hidden",
              } as React.CSSProperties}
            >
              {state.solved||state.skipped ? current.title : stripFeaturing(current.synonymTitle)}
            </p>
            <p className="text-xs mt-1.5 relative z-10" style={{color:`${AMBER}55`,letterSpacing:"0.08em"}}>
              {state.solved||state.skipped ? current.artist : decade}
            </p>
          </div>

          {/* ── Hints revealed ── */}
          {state.hintsUsed>0&&!state.solved&&!state.skipped&&(
            <div style={{padding:"12px 20px 0",display:"flex",flexDirection:"column",gap:6}}>
              {current.hints.slice(0,state.hintsUsed).map((hint,hi)=>(
                <div key={hi} style={{display:"flex",alignItems:"center",gap:8,fontSize:13,padding:"8px 12px",borderRadius:8,background:"#111111",border:"1px solid #2a2a2a",color:`${AMBER}cc`}}>
                  <span style={{opacity:0.5,fontSize:11}}>Hint {hi+1}</span>
                  <span>{hint}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── Main content ── */}
          <div style={{padding:"12px 20px 0",display:"flex",flexDirection:"column",gap:10}}>
            {state.solved ? (
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <span style={{color:"#00b4ff",fontWeight:700,fontSize:14}}><Check className="text-[#00b4ff]"/> {current.title}</span>
                  <span style={{color:`${AMBER}66`,fontSize:12}}>+{titleScore(state.hintsUsed,true)} pts</span>
                </div>
                <p style={{color:`${AMBER}88`,fontSize:13,marginTop:-8}}>{state.feedback}</p>

                {!bonusComplete ? (
                  <div style={{display:"flex",flexDirection:"column",gap:12,borderTop:"1px solid #222222",paddingTop:14}}>
                    <p style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:`${AMBER}66`}}>
                      Bonus Round — up to +{state.hintsUsed>=3?0:state.hintsUsed>=2?ARTIST_BONUS:ARTIST_BONUS+YEAR_BONUS} pts
                    </p>
                    {state.hintsUsed<3&&(
                      <div style={{display:"flex",flexDirection:"column",gap:6}}>
                        <label style={{fontSize:11,color:`${AMBER}66`}}>Who&apos;s the artist?</label>
                        {state.artistCorrect===null ? (
                          <div style={{display:"flex",gap:8}}>
                            <div style={{flex:1,position:"relative"}} ref={artistDropdownRef}>
                              <input ref={artistRef} type="text" value={state.artistGuess}
                                onChange={e=>{updateState(songIndex,{artistGuess:e.target.value,artistFeedback:""});setArtistDropdownOpen(true);}}
                                onFocus={()=>setArtistDropdownOpen(true)}
                                onBlur={()=>setTimeout(()=>setArtistDropdownOpen(false),150)}
                                onKeyDown={e=>e.key==="Enter"&&handleArtistSubmit()}
                                placeholder="Type to search artists…"
                                style={{width:"100%",background:"#111111",border:"1px solid #2a2a2a",borderRadius:10,padding:"8px 12px",fontSize:13,color:"#d0d0d0",outline:"none"}}
                              />
                              {artistDropdownOpen&&state.artistGuess.trim().length>0&&(()=>{
                                const q=state.artistGuess.toLowerCase();
                                const matches=allArtists.filter(a=>a.toLowerCase().includes(q)).slice(0,8);
                                return matches.length>0?(
                                  <div style={{position:"absolute",zIndex:50,left:0,right:0,top:"100%",marginTop:4,background:"#111111",border:"1px solid #2a2a2a",borderRadius:10,overflow:"hidden",boxShadow:"0 8px 24px rgba(0,0,0,0.7)"}}>
                                    {matches.map(a=>(
                                      <button key={a} onMouseDown={()=>{setArtistDropdownOpen(false);updateState(songIndex,{artistGuess:a,artistFeedback:"",artistCorrect:validateArtist(a,current.artist)});}} style={{width:"100%",textAlign:"left",padding:"8px 12px",fontSize:13,color:"#d0d0d0",background:"transparent",border:"none",cursor:"pointer"}}>{a}</button>
                                    ))}
                                  </div>
                                ):null;
                              })()}
                            </div>
                            <button onClick={handleArtistSubmit} style={{padding:"8px 16px",borderRadius:10,background:`linear-gradient(135deg,${AMBER},#ff8c00)`,color:"#080808",fontWeight:700,fontSize:13,border:"none",cursor:"pointer"}}>+{ARTIST_BONUS}</button>
                          </div>
                        ) : (
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",borderRadius:10,border:`1px solid ${state.artistCorrect?"#00b4ff44":"#ef444444"}`,background:state.artistCorrect?"rgba(168,255,62,0.08)":"rgba(239,68,68,0.08)"}}>
                            <span style={{fontSize:13,color:"#d0d0d0"}}>{state.artistCorrect?state.artistGuess:current.artist}</span>
                            <span style={{fontSize:13,fontWeight:700,color:state.artistCorrect?"#00b4ff":"#ef4444"}}>{state.artistCorrect?`+${ARTIST_BONUS}`:"✕"}</span>
                          </div>
                        )}
                      </div>
                    )}
                    {state.hintsUsed<2&&(
                      <div style={{display:"flex",flexDirection:"column",gap:6}}>
                        <label style={{fontSize:11,color:`${AMBER}66`}}>What year was it released?</label>
                        {state.yearCorrect===null ? (
                          <div style={{display:"flex",gap:8}}>
                            <input type="text" inputMode="numeric" value={state.yearGuess} onChange={e=>updateState(songIndex,{yearGuess:e.target.value,yearFeedback:""})} onKeyDown={e=>e.key==="Enter"&&handleYearSubmit()} style={{flex:1,background:"#111111",border:"1px solid #2a2a2a",borderRadius:10,padding:"8px 12px",fontSize:13,color:"#d0d0d0",outline:"none"}}/>
                            <button onClick={handleYearSubmit} style={{padding:"8px 16px",borderRadius:10,background:`linear-gradient(135deg,${AMBER},#ff8c00)`,color:"#080808",fontWeight:700,fontSize:13,border:"none",cursor:"pointer"}}>+{YEAR_BONUS}</button>
                          </div>
                        ) : (
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",borderRadius:10,border:`1px solid ${state.yearCorrect==="exact"?"#00b4ff44":state.yearCorrect==="close"?"#facc1544":"#ef444444"}`,background:state.yearCorrect==="exact"?"rgba(168,255,62,0.08)":state.yearCorrect==="close"?"rgba(250,204,21,0.08)":"rgba(239,68,68,0.08)"}}>
                            <span style={{fontSize:13,color:"#d0d0d0"}}>{state.yearCorrect?state.yearGuess:`${state.yearGuess} — answer: ${state.songInfo&&state.songInfo!=="loading"?state.songInfo.releaseYear:current.releaseYear??""}`}</span>
                            <span style={{fontSize:13,fontWeight:700,color:state.yearCorrect==="exact"?"#00b4ff":state.yearCorrect==="close"?"#facc15":"#ef4444"}}>{state.yearCorrect==="exact"?`+${YEAR_BONUS}`:state.yearCorrect==="close"?`+${YEAR_BONUS_CLOSE}`:"✕"}</span>
                          </div>
                        )}
                      </div>
                    )}
                    <button onClick={handleSkipBonus} style={{fontSize:11,color:`${AMBER}55`,textAlign:"left",background:"none",border:"none",cursor:"pointer",padding:0}}>Skip bonus →</button>
                  </div>
                ) : (
                  <div style={{display:"flex",flexDirection:"column",gap:12,borderTop:"1px solid #222222",paddingTop:14}}>
                    <div style={{display:"flex",gap:16,fontSize:13}}>
                      <span style={{color:state.artistCorrect?"#00b4ff":"#ef4444"}}>{state.artistCorrect?<><Check/> Artist +{ARTIST_BONUS}</>:`✕ Artist (${current.artist})`}</span>
                      <span style={{color:state.yearCorrect==="exact"?"#00b4ff":state.yearCorrect==="close"?"#facc15":"#ef4444"}}>{state.yearCorrect==="exact"?<><Check/> Year +{YEAR_BONUS}</>:state.yearCorrect==="close"?`~ Year +${YEAR_BONUS_CLOSE}`:`✕ Year (${state.songInfo&&state.songInfo!=="loading"?state.songInfo.releaseYear:current.releaseYear??""})`}</span>
                    </div>
                    <SongReveal info={state.songInfo}/>
                  </div>
                )}
              </div>
            ) : state.skipped ? (
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                <p style={{fontSize:12,color:"#ff6b3d",fontWeight:500}}>{state.feedback}</p>
                <p style={{fontSize:13,color:`${AMBER}66`}}>{current.title} — {current.artist}</p>
              </div>
            ) : (
              <>
                <input
                  ref={inputRef}
                  type="text"
                  value={state.guess}
                  onChange={e=>updateState(songIndex,{guess:e.target.value,feedback:""})}
                  onKeyDown={e=>e.key==="Enter"&&handleSubmit()}
                  placeholder="Name that track…"
                  style={{
                    width:"100%",background:"#111111",
                    border:`1px solid ${state.feedbackWarm?"#ff8c00":"#2a2a2a"}`,
                    borderRadius:10,padding:"10px 14px",fontSize:14,
                    color:"#d0d0d0",outline:"none",
                    boxShadow: state.feedbackWarm?`0 0 12px #ff8c0044`:"none",
                  }}
                />
                {state.feedback&&(
                  <p style={{fontSize:13,color:state.feedbackWarm?"#ff8c00":"#ef4444",marginTop:-4}}>{state.feedback}</p>
                )}
              </>
            )}
          </div>

          {/* ── Jukebox selector buttons ── */}
          {!state.solved&&!state.skipped&&(
            <div style={{padding:"16px 20px 20px",display:"flex",justifyContent:"center",alignItems:"flex-end",gap:12}}>
              <JukeButton
                onClick={handleHint}
                disabled={state.hintsUsed>=current.hints.length||state.solved}
                indicatorColor="#7b61ff"
                topLabel={state.hintsUsed>0?`${state.hintsUsed}/${current.hints.length}`:"Hint"}
                bottomLabel={state.hintsUsed<current.hints.length?`-${HINT_COSTS[state.hintsUsed]} pts`:"used"}
              />
              <JukeButton
                onClick={handleSubmit}
                disabled={false}
                indicatorColor={AMBER}
                topLabel="Play"
                bottomLabel="Submit"
                large
              />
              <JukeButton
                onClick={handleReveal}
                disabled={state.hintsUsed<current.hints.length}
                indicatorColor="#ff3d7a"
                topLabel="Skip"
                bottomLabel="0 pts"
              />
            </div>
          )}

          {/* Next / Results */}
          {(state.skipped||(state.solved&&bonusComplete))&&(
            <div style={{padding:"0 20px 20px"}}>
              <button
                onClick={handleNext}
                style={{width:"100%",padding:"10px",borderRadius:10,background:`linear-gradient(135deg,${AMBER},#ff8c00)`,color:"#080808",fontWeight:700,fontSize:14,border:"none",cursor:"pointer"}}
              >
                {songIndex<puzzle.length-1?"Next Song →":"See Results →"}
              </button>
            </div>
          )}

          {/* ── Speaker grille ── */}
          <div style={{padding:"0 24px 20px",display:"flex",flexDirection:"column",gap:3}}>
            <div style={{borderTop:"1px solid #222222",paddingTop:14,display:"flex",flexDirection:"column",gap:3}}>
              {Array.from({length:7}).map((_,i)=>(
                <div key={i} style={{
                  height:3,
                  borderRadius:4,
                  background:`linear-gradient(90deg, transparent 0%, #222222 15%, #1a1a1a 50%, #222222 85%, transparent 100%)`,
                  opacity: 0.6+i*0.04,
                }}/>
              ))}
            </div>
          </div>

        </div>{/* end dark body */}
        </div>{/* end chrome ring */}

        {/* Score bar */}
        <div className="flex justify-between items-center text-xs px-1" style={{color:`${AMBER}55`}}>
          <span>Score: {totalScore.toLocaleString()} / {maxScore.toLocaleString()}</span>
          <div className="flex items-center gap-3">
            {streak>0&&<span style={{color:`${AMBER}cc`,fontWeight:600}}>🔥 {streak}</span>}
            <span>{states.filter(s=>s.solved).length} of {puzzle.length} solved</span>
          </div>
        </div>

      </div>

      {/* Full-screen confetti */}
      {fullConfetti&&(
        <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden" aria-hidden="true">
          {confettiPieces.map(p=>(
            <div key={p.id} style={{position:"absolute",left:`${p.left}%`,top:"-12px",width:p.size,height:p.size,borderRadius:p.round?"50%":"2px",background:p.color,animation:`confetti-fall ${p.duration}s ease-in ${p.delay}s forwards`}}/>
          ))}
        </div>
      )}
    </main>
  );
}
