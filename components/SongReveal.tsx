"use client";

import Image from "next/image";
import { SongInfo } from "@/lib/fetchSongInfo";

export default function SongReveal({ info }: { info: SongInfo | null | "loading" }) {
  if (info === "loading") {
    return (
      <div className="flex items-center gap-3 animate-pulse">
        <div className="w-14 h-14 rounded-xl bg-[color:var(--color-border)] shrink-0" />
        <div className="flex flex-col gap-1.5">
          <div className="h-3 w-32 rounded bg-[color:var(--color-border)]" />
          <div className="h-3 w-24 rounded bg-[color:var(--color-border)]" />
          <div className="h-3 w-20 rounded bg-[color:var(--color-border)]" />
        </div>
      </div>
    );
  }

  if (!info) return null;

  return (
    <div className="flex items-center gap-4 p-3 rounded-xl bg-[color:var(--color-navy)] border border-[color:var(--color-border)]">
      <Image
        src={info.artworkUrl}
        alt={`${info.collectionName} album art`}
        width={56}
        height={56}
        className="rounded-xl shrink-0 object-cover"
        unoptimized
      />
      <div className="flex flex-col gap-0.5 min-w-0">
        <p className="text-sm font-bold truncate">{info.trackName}</p>
        <p className="text-xs text-[color:var(--color-muted)] truncate">{info.artistName}</p>
        <p className="text-xs text-[color:var(--color-muted)] truncate">{info.collectionName}</p>
        <p className="text-xs text-[color:var(--color-muted)]">{info.releaseYear} · {info.genre}</p>
      </div>
    </div>
  );
}
