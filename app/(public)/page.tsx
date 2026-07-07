"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

function localDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const FEATURED = [
  { title: "Bohemian Rhapsody", artist: "Queen", year: "1975" },
  { title: "Lose Yourself", artist: "Eminem", year: "2002" },
  { title: "bad guy", artist: "Billie Eilish", year: "2019" },
  { title: "Sweet Child O' Mine", artist: "Guns N' Roses", year: "1988" },
  { title: "Superstition", artist: "Stevie Wonder", year: "1972" },
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


export default function Home() {
  const router = useRouter();
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

  // Duplicate for seamless loop
  const tiles = [...FEATURED, ...FEATURED];

  return (
    <main className="relative flex flex-col justify-center min-h-[100svh] overflow-hidden gap-0">
      {/* Background glows */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] pointer-events-none" style={{ background: "radial-gradient(ellipse at top left, rgba(249,115,22,0.45) 0%, transparent 70%)" }} />
      <div className="absolute bottom-0 right-0 w-[520px] h-[520px] pointer-events-none" style={{ background: "radial-gradient(ellipse at bottom right, rgba(124,58,237,0.55) 0%, transparent 70%)" }} />

      {/* ── MOBILE layout ── */}
      <div className="md:hidden flex flex-col gap-0">
        {/* Hero text */}
        <div className="px-6 pb-8 flex flex-col gap-4">
          <h1 className="text-[2.4rem] font-black leading-tight tracking-tight">
            Familiar Songs.<br />Unfamiliar Titles.
          </h1>
          <p className="text-base text-[color:var(--color-muted)] max-w-sm">
            Every song name gets twisted into synonyms, can you figure them out?
          </p>
        </div>

        {/* Album art marquee */}
        <div
          className="w-full overflow-hidden mb-10"
          style={{ maskImage: "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)", WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)" }}
        >
          <div
            className="flex gap-3 py-2"
            style={{ width: "max-content", animation: "marquee 28s linear infinite" }}
          >
            {tiles.map((song, i) => {
              const artwork = artworks[i % FEATURED.length];
              return (
                <div
                  key={i}
                  className="w-[130px] h-[130px] rounded-2xl overflow-hidden shrink-0"
                  style={{ background: "rgba(255,255,255,0.07)" }}
                >
                  {artwork ? (
                    <Image
                      src={artwork}
                      alt={song.title}
                      width={130}
                      height={130}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full" style={{ animation: "pulse 1.5s ease-in-out infinite", background: "rgba(255,255,255,0.05)" }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="px-6">
          <button
            onClick={() => router.push(`/play/${localDateString()}`)}
            className="w-full py-4 rounded-2xl font-bold text-base text-white hover:opacity-90 transition-opacity"
            style={{ background: "var(--btn-gradient)" }}
          >
            ▶ Play Today&apos;s Puzzle
          </button>
        </div>
      </div>

      {/* ── DESKTOP layout ── */}
      <div className="hidden md:flex flex-col items-center text-center gap-8 px-8">
        <div className="flex flex-col gap-4 items-center">
          <h1 className="text-6xl font-black leading-tight tracking-tight">
            Familiar Songs. Unfamiliar Titles.
          </h1>
          <p className="text-lg text-[color:var(--color-muted)] max-w-lg">
            Every song name gets twisted into synonyms, can you figure them out?
          </p>
        </div>

        <button
          onClick={() => router.push(`/play/${localDateString()}`)}
          className="px-10 py-4 rounded-full font-bold text-base text-white hover:opacity-90 transition-opacity"
          style={{ background: "var(--btn-gradient)" }}
        >
          ▶ Play Today&apos;s Puzzle
        </button>

        {/* Scrolling marquee */}
        <div
          className="w-full overflow-hidden"
          style={{ maskImage: "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)", WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)" }}
        >
          <div
            className="flex gap-3 py-2"
            style={{ width: "max-content", animation: "marquee 28s linear infinite" }}
          >
            {tiles.map((song, i) => {
              const artwork = artworks[i % FEATURED.length];
              return (
                <div
                  key={i}
                  className="w-[140px] h-[140px] rounded-2xl overflow-hidden shrink-0"
                  style={{ background: "rgba(255,255,255,0.07)" }}
                >
                  {artwork ? (
                    <Image
                      src={artwork}
                      alt={song.title}
                      width={140}
                      height={140}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full" style={{ animation: "pulse 1.5s ease-in-out infinite", background: "rgba(255,255,255,0.05)" }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
