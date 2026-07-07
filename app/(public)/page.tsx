"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

function localDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const FEATURED = [
  { title: "Baby", artist: "Justin Bieber", year: "2010" },
  { title: "bad guy", artist: "Billie Eilish", year: "2019" },
  { title: "Brown Eyed Girl", artist: "Van Morrison", year: "1967" },
  { title: "Get Lucky", artist: "Daft Punk", year: "2013" },
  { title: "Since U Been Gone", artist: "Kelly Clarkson", year: "2004" },
  { title: "Rolling in the Deep", artist: "Adele", year: "2010" },
  { title: "Blinding Lights", artist: "The Weeknd", year: "2019" },
  { title: "Shape of You", artist: "Ed Sheeran", year: "2017" },
  { title: "Started From The Bottom", artist: "Drake", year: "2013" },
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
    <main className="flex flex-col justify-center min-h-[100svh] overflow-hidden gap-0">
      {/* Hero text */}
      <div className="px-6 pb-8 flex flex-col gap-4">
        <h1 className="text-5xl font-black leading-tight tracking-tight">
          Do you have<br />what it takes?
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
    </main>
  );
}
