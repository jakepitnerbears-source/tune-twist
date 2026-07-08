"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const FEATURED = [
  { title: "Bohemian Rhapsody", artist: "Queen", year: "1975" },
  { title: "Lose Yourself", artist: "Eminem", year: "2002" },
  { title: "bad guy", artist: "Billie Eilish", year: "2019" },
  { title: "Espresso", artist: "Sabrina Carpenter", year: "2024" },
  { title: "Thriller", artist: "Michael Jackson", year: "1982" },
  { title: "Mr. Brightside", artist: "The Killers", year: "2003" },
  { title: "Get Lucky", artist: "Daft Punk", year: "2013" },
  { title: "Jolene", artist: "Dolly Parton", year: "1973" },
  { title: "Hotline Bling", artist: "Drake", year: "2015" },
  { title: "Take On Me", artist: "A-ha", year: "1985" },
  { title: "No Scrubs", artist: "TLC", year: "1999" },
  { title: "Blinding Lights", artist: "The Weeknd", year: "2019" },
  { title: "Hotel California", artist: "Eagles", year: "1977" },
  { title: "Rolling in the Deep", artist: "Adele", year: "2010" },
];

const DESIGNS = ["Current", "Fan Carousel", "Grid", "Stacked"] as const;
type Design = (typeof DESIGNS)[number];

const GRADIENT_TEXT = {
  background: "linear-gradient(135deg, #7c3aed 0%, #c026d3 50%, #f59e0b 100%)",
  WebkitBackgroundClip: "text" as const,
  WebkitTextFillColor: "transparent" as const,
  backgroundClip: "text" as const,
};

function useArtworks() {
  const [artworks, setArtworks] = useState<(string | null)[]>(FEATURED.map(() => null));
  useEffect(() => {
    FEATURED.forEach(async (song, i) => {
      try {
        const params = new URLSearchParams({ title: song.title, artist: song.artist, year: song.year });
        const res = await fetch(`/api/song-info?${params}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data?.artworkUrl) {
          setArtworks((prev) => { const next = [...prev]; next[i] = data.artworkUrl; return next; });
        }
      } catch {}
    });
  }, []);
  return artworks;
}

// Current: horizontal scrolling marquee
function CurrentLayout({ artworks }: { artworks: (string | null)[] }) {
  const tiles = [...FEATURED, ...FEATURED];
  return (
    <div className="flex flex-col items-center text-center gap-8">
      <div className="flex flex-col gap-4 items-center">
        <h1 className="text-5xl font-black leading-tight tracking-tight">
          Familiar Songs.<br />
          <span style={GRADIENT_TEXT}>Unfamiliar Titles.</span>
        </h1>
        <p className="text-base text-[color:var(--color-muted)] max-w-lg">
          Every song name gets twisted into synonyms, can you figure them out?
        </p>
      </div>
      <button className="px-10 py-4 rounded-full font-bold text-base text-white" style={{ background: "var(--btn-gradient)" }}>
        ▶ Play Today&apos;s Puzzle
      </button>
      <div className="w-full overflow-hidden" style={{ maskImage: "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)", WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)" }}>
        <div className="flex gap-3 py-2" style={{ width: "max-content", animation: "marquee 28s linear infinite" }}>
          {tiles.map((song, i) => {
            const artwork = artworks[i % FEATURED.length];
            return (
              <div key={i} className="w-[140px] h-[140px] rounded-2xl overflow-hidden shrink-0" style={{ background: "rgba(255,255,255,0.07)" }}>
                {artwork ? (
                  <Image src={artwork} alt={song.title} width={140} height={140} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full" style={{ background: "rgba(255,255,255,0.05)" }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Fan Carousel: Spotify-style 3D fan of album cards
function FanCarousel({ artworks }: { artworks: (string | null)[] }) {
  const [active, setActive] = useState(2);
  const visible = [-2, -1, 0, 1, 2];

  function getTransform(offset: number) {
    const absOffset = Math.abs(offset);
    const rotateY = offset * 28;
    const translateX = offset * 110;
    const translateZ = -absOffset * 80;
    const scale = 1 - absOffset * 0.12;
    return `perspective(800px) rotateY(${rotateY}deg) translateX(${translateX}px) translateZ(${translateZ}px) scale(${scale})`;
  }

  const displaySongs = FEATURED.slice(0, 5);

  return (
    <div className="flex flex-col items-center gap-10">
      <div className="flex flex-col gap-4 items-center">
        <h1 className="text-5xl font-black leading-tight tracking-tight text-center">
          Familiar Songs.<br />
          <span style={GRADIENT_TEXT}>Unfamiliar Titles.</span>
        </h1>
        <p className="text-base text-[color:var(--color-muted)] max-w-lg text-center">
          Every song name gets twisted into synonyms, can you figure them out?
        </p>
      </div>

      {/* Fan */}
      <div className="relative w-full flex items-center justify-center" style={{ height: 280 }}>
        {visible.map((offset) => {
          const idx = ((active + offset) % displaySongs.length + displaySongs.length) % displaySongs.length;
          const song = displaySongs[idx];
          const artwork = artworks[idx];
          const absOffset = Math.abs(offset);
          return (
            <div
              key={offset}
              onClick={() => offset !== 0 && setActive((active + offset + displaySongs.length) % displaySongs.length)}
              style={{
                position: "absolute",
                transform: getTransform(offset),
                zIndex: 10 - absOffset,
                transition: "transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                cursor: offset !== 0 ? "pointer" : "default",
              }}
            >
              <div
                className="rounded-2xl overflow-hidden shadow-2xl"
                style={{
                  width: 180,
                  height: 180,
                  background: "rgba(255,255,255,0.08)",
                  border: offset === 0 ? "2px solid rgba(124,58,237,0.6)" : "1px solid rgba(255,255,255,0.08)",
                  opacity: 1 - absOffset * 0.18,
                }}
              >
                {artwork ? (
                  <Image src={artwork} alt={song.title} width={180} height={180} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full" style={{ background: "rgba(255,255,255,0.05)" }} />
                )}
              </div>
              {offset === 0 && (
                <div className="text-center mt-3">
                  <p className="text-sm font-bold text-white">{song.title}</p>
                  <p className="text-xs text-[color:var(--color-muted)]">{song.artist}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button className="px-10 py-4 rounded-full font-bold text-base text-white" style={{ background: "var(--btn-gradient)" }}>
        ▶ Play Today&apos;s Puzzle
      </button>
    </div>
  );
}

// Grid: 3x2 album art grid
function GridLayout({ artworks }: { artworks: (string | null)[] }) {
  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex flex-col gap-4 items-center">
        <h1 className="text-5xl font-black leading-tight tracking-tight text-center">
          Familiar Songs.<br />
          <span style={GRADIENT_TEXT}>Unfamiliar Titles.</span>
        </h1>
        <p className="text-base text-[color:var(--color-muted)] max-w-lg text-center">
          Every song name gets twisted into synonyms, can you figure them out?
        </p>
      </div>
      <div className="grid grid-cols-6 gap-2">
        {FEATURED.slice(0, 6).map((song, i) => {
          const artwork = artworks[i];
          return (
            <div key={i} className="w-[100px] h-[100px] rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
              {artwork ? (
                <Image src={artwork} alt={song.title} width={100} height={100} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full" style={{ background: "rgba(255,255,255,0.05)" }} />
              )}
            </div>
          );
        })}
      </div>
      <button className="px-10 py-4 rounded-full font-bold text-base text-white" style={{ background: "var(--btn-gradient)" }}>
        ▶ Play Today&apos;s Puzzle
      </button>
    </div>
  );
}

// Stacked: overlapping cards with rotation
function StackedLayout({ artworks }: { artworks: (string | null)[] }) {
  const stack = FEATURED.slice(0, 5);
  const rotations = [-6, -3, 0, 3, 6];
  return (
    <div className="flex items-center gap-20">
      <div className="flex flex-col gap-6">
        <h1 className="text-5xl font-black leading-tight tracking-tight">
          Familiar Songs.<br />
          <span style={GRADIENT_TEXT}>Unfamiliar Titles.</span>
        </h1>
        <p className="text-base text-[color:var(--color-muted)] max-w-sm">
          Every song name gets twisted into synonyms, can you figure them out?
        </p>
        <button className="px-10 py-4 rounded-full font-bold text-base text-white w-fit" style={{ background: "var(--btn-gradient)" }}>
          ▶ Play Today&apos;s Puzzle
        </button>
      </div>
      <div className="relative w-[220px] h-[220px] shrink-0">
        {stack.map((song, i) => {
          const artwork = artworks[i];
          const rot = rotations[i];
          return (
            <div
              key={i}
              className="absolute inset-0 rounded-2xl overflow-hidden shadow-xl"
              style={{
                background: "rgba(255,255,255,0.08)",
                transform: `rotate(${rot}deg)`,
                zIndex: i,
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              {artwork ? (
                <Image src={artwork} alt={song.title} width={220} height={220} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full" style={{ background: "rgba(255,255,255,0.05)" }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function SplashLab() {
  const [active, setActive] = useState<Design>("Current");
  const artworks = useArtworks();

  return (
    <>
      {/* Floating design switcher — fixed top right, out of the way */}
      <div className="fixed top-4 right-4 z-50 flex gap-1.5 flex-wrap justify-end max-w-xs" style={{ background: "rgba(8,6,15,0.85)", backdropFilter: "blur(12px)", borderRadius: 999, padding: "6px 10px", border: "1px solid rgba(124,58,237,0.25)" }}>
        {DESIGNS.map((d) => (
          <button
            key={d}
            onClick={() => setActive(d)}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
              active === d
                ? "text-white border-transparent"
                : "border-transparent text-[color:var(--color-muted)] hover:text-white"
            }`}
            style={active === d ? { background: "var(--btn-gradient)" } : {}}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Full-viewport preview — identical to real home page */}
      <main className="relative flex flex-col justify-center min-h-[100svh] overflow-hidden">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] pointer-events-none" style={{ background: "radial-gradient(ellipse at top left, rgba(249,115,22,0.45) 0%, transparent 70%)", zIndex: 0 }} />
        <div className="absolute bottom-0 right-0 w-[520px] h-[520px] pointer-events-none" style={{ background: "radial-gradient(ellipse at bottom right, rgba(124,58,237,0.55) 0%, transparent 70%)", zIndex: 0 }} />
        <div className="relative z-10 flex flex-col items-center px-8">
          {active === "Current" && <CurrentLayout artworks={artworks} />}
          {active === "Fan Carousel" && <FanCarousel artworks={artworks} />}
          {active === "Grid" && <GridLayout artworks={artworks} />}
          {active === "Stacked" && <StackedLayout artworks={artworks} />}
        </div>
      </main>
    </>
  );
}
