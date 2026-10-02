import type { Metadata } from "next";
import Link from "next/link";
import { PACKS, getPackSongs } from "@/lib/packs";

export const metadata: Metadata = {
  title: "Song Packs — TuneTwist",
  description: "Free, replayable song-guessing quizzes organized by artist. No daily limit — play as many rounds as you want.",
  alternates: {
    canonical: "/packs",
  },
};

export default function PacksIndex() {
  return (
    <main className="flex flex-col items-center px-4 pt-[108px] pb-12">
      <div className="w-full max-w-[560px] flex flex-col gap-8">

        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-bold tracking-tight">Song Packs</h1>
          <p className="text-[color:var(--color-muted)]">
            Same idea as TuneTwist&apos;s daily puzzle — song titles rewritten with synonyms — but
            organized by artist, and playable anytime. No daily limit.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {PACKS.map((pack) => (
            <Link
              key={pack.slug}
              href={`/packs/${pack.slug}`}
              className="flex flex-col gap-1 p-5 rounded-2xl bg-[color:var(--color-card)] border border-[color:var(--color-border)] hover:opacity-80 transition-opacity"
            >
              <span className="text-lg font-bold text-white">{pack.heading}</span>
              <span className="text-sm text-[color:var(--color-muted)]">{getPackSongs(pack).length} songs</span>
            </Link>
          ))}
        </div>

      </div>
    </main>
  );
}
