import Link from "next/link";

const DIFFICULTY_STYLES: Record<string, string> = {
  Easy: "bg-[color:var(--color-green)] text-[color:var(--color-navy)]",
  Medium: "bg-yellow-400 text-[color:var(--color-navy)]",
  Hard: "bg-[color:var(--color-coral)] text-white",
  Viral: "bg-[color:var(--color-purple)] text-white",
};

function Badge({ label }: { label: string }) {
  return (
    <span className={`text-xs font-bold px-3 py-1 rounded-full ${DIFFICULTY_STYLES[label]}`}>
      {label}
    </span>
  );
}

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

export default function HowToPlay() {
  return (
    <main className="flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-[560px] flex flex-col gap-10">

        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold tracking-tight">How to Play</h1>
          <p className="text-[color:var(--color-muted)]">
            Every day, 5 song titles get rewritten using synonyms. Your job is to decode them.
          </p>
        </div>

        {/* Example */}
        <Section title="The Idea">
          <Card>
            <p className="text-xs font-semibold uppercase tracking-widest text-[color:var(--color-muted)]">You see this</p>
            <p className="text-2xl font-bold">Form of You</p>
            <div className="border-t border-[color:var(--color-border)] pt-3 flex items-center gap-2">
              <span className="text-[color:var(--color-green)] font-bold text-sm">✓ Shape of You</span>
              <span className="text-xs text-[color:var(--color-muted)]">— Ed Sheeran</span>
            </div>
          </Card>
          <p className="text-sm text-[color:var(--color-muted)]">
            Every word (or a few key ones) has been swapped for a synonym. The structure stays the same — your job is to reverse-engineer the real title.
          </p>
        </Section>

        {/* Daily structure */}
        <Section title="Each Day">
          <Card>
            <div className="flex flex-col gap-2.5">
              {[
                { label: "Easy", desc: "Minimal changes. Very recognizable." },
                { label: "Medium", desc: "2–3 word swaps. Requires some thought." },
                { label: "Medium", desc: "A second medium to keep you honest." },
                { label: "Hard", desc: "More abstract. Still fair and solvable." },
                { label: "Viral", desc: "A throwback or a TikTok-era banger." },
              ].map((row, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-[color:var(--color-muted)] w-4">{i + 1}</span>
                  <Badge label={row.label} />
                  <span className="text-sm text-[color:var(--color-muted)]">{row.desc}</span>
                </div>
              ))}
            </div>
          </Card>
        </Section>

        {/* Guessing */}
        <Section title="Guessing">
          <Card>
            <ul className="flex flex-col gap-2 text-sm text-[color:var(--color-muted)]">
              <li>✓ &nbsp;Unlimited guesses — no penalty for wrong answers</li>
              <li>✓ &nbsp;Capitalization and punctuation are ignored</li>
              <li>✓ &nbsp;Small words like "the", "of", "a" can be skipped</li>
              <li>✓ &nbsp;Minor typos are forgiven</li>
              <li className="text-white font-medium pt-1">Hit Enter or Submit to check your guess</li>
            </ul>
          </Card>
        </Section>

        {/* Hints */}
        <Section title="Hints">
          <Card>
            <p className="text-sm text-[color:var(--color-muted)]">
              Each song has 3 escalating hints. Using them lowers your available points for that song.
            </p>
            <div className="flex flex-col gap-2">
              {[
                { n: "1", text: `Genre or era — e.g. "2010s pop"` },
                { n: "2", text: `Artist name or partial — e.g. "Artist: Ed Sheeran"` },
                { n: "3", text: `Partial title — e.g. "S_____ of You"` },
              ].map((h) => (
                <div
                  key={h.n}
                  className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-[color:var(--color-navy)] border border-[color:var(--color-purple)] text-[color:var(--color-purple)]"
                >
                  <span className="opacity-60 text-xs">Hint {h.n}</span>
                  <span>{h.text}</span>
                </div>
              ))}
            </div>
          </Card>
        </Section>

        {/* Bonus round */}
        <Section title="Bonus Round">
          <Card>
            <p className="text-sm text-[color:var(--color-muted)]">
              After decoding the title, guess the artist and release year. These don't affect your score — but get all three right with no hints and you earn a ★.
            </p>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center gap-2">
                <span style={{ color: "#facc15" }}>★</span>
                <span className="text-[color:var(--color-muted)]">Perfect song: correct title + artist + year, no hints used</span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ color: "rgba(255,255,255,0.2)" }}>★</span>
                <span className="text-[color:var(--color-muted)]">Max 5 stars per daily game</span>
              </div>
            </div>
            <p className="text-xs text-[color:var(--color-muted)]">
              Year is accepted within ±1 for the bonus display, but only an exact match earns a star.
            </p>
          </Card>
        </Section>

        {/* Scoring */}
        <Section title="Scoring">
          <Card>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between font-medium">
                <span>No hints used</span>
                <span className="font-bold text-[color:var(--color-green)]">1,000 pts</span>
              </div>
              <div className="flex justify-between text-[color:var(--color-muted)]">
                <span>Correct after hint 1</span>
                <span>750 pts</span>
              </div>
              <div className="flex justify-between text-[color:var(--color-muted)]">
                <span>Correct after hint 2</span>
                <span>500 pts</span>
              </div>
              <div className="flex justify-between text-[color:var(--color-muted)]">
                <span>Correct after hint 3</span>
                <span>250 pts</span>
              </div>
              <div className="flex justify-between text-[color:var(--color-muted)]">
                <span>Song not solved</span>
                <span>0 pts</span>
              </div>
              <div className="border-t border-[color:var(--color-border)] pt-2 flex justify-between font-bold">
                <span>Max daily total</span>
                <span className="text-[color:var(--color-green)]">5,000 pts</span>
              </div>
            </div>
          </Card>
        </Section>

        {/* CTA */}
        <Link
          href="/"
          className="w-full py-3 rounded-xl bg-[color:var(--color-green)] text-[color:var(--color-navy)] text-sm font-bold text-center hover:opacity-90 transition-opacity"
        >
          Play Today's Puzzle →
        </Link>

      </div>
    </main>
  );
}
