import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TuneTwist — A Daily Word Game for Music Lovers (Like Wordle, But for Songs)",
  description:
    "Love Wordle or Heardle? TuneTwist is a free daily word game for music fans — song titles get rewritten using synonyms, and it's your job to decode them. New puzzle every day.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-bold">{title}</h2>
      {children}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[color:var(--color-card)] border border-[color:var(--color-border)] rounded-2xl p-5 flex flex-col gap-3">
      {children}
    </div>
  );
}

function PlayCTA() {
  return (
    <Link
      href="/play"
      className="w-full py-3.5 rounded-xl text-sm font-bold text-center hover:opacity-90 transition-opacity"
      style={{ background: "var(--btn-gradient)", color: "white" }}
    >
      Play Today&apos;s Puzzle →
    </Link>
  );
}

export default function DailyMusicWordGame() {
  return (
    <main className="flex flex-col items-center px-4 pt-[108px] pb-12">
      <div className="w-full max-w-[560px] flex flex-col gap-10">

        {/* Header */}
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-bold tracking-tight">A Daily Word Game for Music Lovers</h1>
          <p className="text-[color:var(--color-muted)]">
            If you&apos;ve played Wordle or Heardle, you already get the rhythm: a short, free puzzle
            that resets every day. TuneTwist puts a music spin on it. Instead of guessing letters or
            naming a song from an audio clip, you&apos;re decoding a song title that&apos;s been
            rewritten word-for-word using synonyms.
          </p>
        </div>

        <PlayCTA />

        {/* How it works */}
        <Section title="How It Works">
          <Card>
            <p className="text-xs font-semibold uppercase tracking-widest text-[color:var(--color-muted)]">You see this</p>
            <p className="text-2xl font-bold">Never Quit Trusting</p>
            <div className="border-t border-[color:var(--color-border)] pt-3 flex items-center gap-2">
              <span className="text-[color:var(--color-green)] font-bold text-sm">✓ Don&apos;t Stop Believin&apos;</span>
              <span className="text-xs text-[color:var(--color-muted)]">— Journey</span>
            </div>
          </Card>
          <p className="text-sm text-[color:var(--color-muted)]">
            Same structure, different words. Work backwards, trust your ear for what &quot;sounds
            like a song,&quot; and type your guess.
          </p>
        </Section>

        {/* How it's different */}
        <Section title="How It's Different">
          <Card>
            <p className="text-sm text-[color:var(--color-muted)]">
              Heardle tests your ear. Wordle tests your vocabulary. TuneTwist tests something in
              between — how well you actually know a song, well enough to recognize it wearing a
              disguise. No audio, no lyrics, no multiple choice. Just the title, twisted.
            </p>
          </Card>
        </Section>

        {/* Why come back daily */}
        <Section title="Why People Come Back Daily">
          <Card>
            <p className="text-sm text-[color:var(--color-muted)]">
              Five songs. A couple of minutes. A new set tomorrow. Unlimited guesses, so there&apos;s
              no penalty for thinking out loud — and if you get stuck, escalating hints are there
              when you want them (though using them costs you points).
            </p>
          </Card>
        </Section>

        <PlayCTA />

        {/* Internal links */}
        <div className="flex flex-col gap-2 text-sm text-center text-[color:var(--color-muted)]">
          <p>
            New here and want the full rundown on scoring and hints?{" "}
            <Link href="/how-to-play" className="text-[color:var(--color-green)] font-semibold hover:opacity-80 transition-opacity">
              Read How to Play →
            </Link>
          </p>
          <p>
            Curious about the story behind TuneTwist?{" "}
            <Link href="/about" className="text-[color:var(--color-green)] font-semibold hover:opacity-80 transition-opacity">
              About →
            </Link>
          </p>
        </div>

      </div>
    </main>
  );
}
