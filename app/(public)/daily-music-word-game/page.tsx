import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Music Wordle — TuneTwist, the Daily Word Game for Music Lovers",
  description:
    "TuneTwist is a free daily music wordle — 5 song titles get rewritten using synonyms, and it's your job to decode them. No audio, no account, new puzzle every day.",
  alternates: {
    canonical: "/daily-music-word-game",
  },
};

const FAQS = [
  {
    q: "Is TuneTwist free?",
    a: "Yes. TuneTwist is completely free to play, and you don't need to create an account — just open the page and start guessing.",
  },
  {
    q: "When does a new puzzle come out?",
    a: "A new set of 5 songs drops every day at midnight. There's one puzzle per day, so there's always a reason to come back tomorrow.",
  },
  {
    q: "Can I play past days?",
    a: "Not yet — right now, TuneTwist only lets you play today's puzzle. It's intentionally locked to one puzzle a day so it stays a daily ritual instead of something you binge through all at once.",
  },
  {
    q: "How does scoring work?",
    a: "Solving a song with fewer hints earns more points, and you get a bonus for guessing the artist and release year. The full point breakdown is on the How to Play page.",
  },
];

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: f.a,
    },
  })),
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }} />
      <div className="w-full max-w-[560px] flex flex-col gap-10">

        {/* Header */}
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-bold tracking-tight">A Daily Music Wordle, Built for Song Lovers</h1>
          <p className="text-[color:var(--color-muted)]">
            If you&apos;ve played Wordle, you already get the rhythm: a short, free puzzle that resets
            every day. TuneTwist is a music wordle — instead of guessing letters, you&apos;re decoding
            a song title that&apos;s been rewritten word-for-word using synonyms.
          </p>
        </div>

        <PlayCTA />

        {/* What is a music wordle */}
        <Section title="What Is a Music Wordle?">
          <p className="text-sm text-[color:var(--color-muted)]">
            A &quot;music wordle&quot; is the general name people use for Wordle-style daily puzzles
            built around songs instead of plain vocabulary — one short puzzle a day, free to play,
            no multi-day grind. TuneTwist is our take on it: every day, 5 real song titles get run
            through a synonym swap, and you work backwards from the disguised version to the
            original.
          </p>
        </Section>

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
            like a song,&quot; and type your guess. Typos and small words like &quot;the&quot; or
            &quot;of&quot; are forgiven, so you&apos;re not fighting the keyboard — just the puzzle.
          </p>
        </Section>

        {/* How it's different */}
        <Section title="How It's Different From Heardle or Spotle">
          <Card>
            <p className="text-sm text-[color:var(--color-muted)]">
              Heardle tests your ear against an audio clip. Spotle has you guess an artist from
              their stats. TuneTwist doesn&apos;t use audio or lyrics at all — it&apos;s a pure word
              puzzle. That means it works anywhere, even with your sound off, and it tests something
              a little different: how well you actually know a song, well enough to recognize it
              wearing a disguise.
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

        {/* FAQ */}
        <Section title="Frequently Asked Questions">
          <div className="flex flex-col gap-3">
            {FAQS.map((f) => (
              <Card key={f.q}>
                <p className="text-sm font-semibold text-white">{f.q}</p>
                <p className="text-sm text-[color:var(--color-muted)]">{f.a}</p>
              </Card>
            ))}
          </div>
        </Section>

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
