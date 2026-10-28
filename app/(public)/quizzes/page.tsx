import { redirect } from "next/navigation";
import Link from "next/link";
import { loadQuizPacks, getQuizPackSongs } from "@/lib/quiz/catalog";
import { previewLogout } from "@/app/actions/preview-auth";
import { hasPreviewAccess } from "@/lib/previewAuth";

export default async function QuizzesHub() {
  // Defense in depth behind proxy.ts's preview gate — see the Next.js proxy docs' warning
  // that route changes can silently stop a matcher from covering a given page.
  if (!(await hasPreviewAccess())) {
    redirect("/quizzes/preview-login?next=%2Fquizzes");
  }

  const packs = loadQuizPacks()
    .map((pack) => ({ pack, songs: getQuizPackSongs(pack.slug) }))
    .filter(({ songs }) => songs.length > 0);

  const grouped: Record<string, typeof packs> = {};
  for (const entry of packs) {
    const key = entry.pack.kind;
    grouped[key] = [...(grouped[key] ?? []), entry];
  }

  const KIND_LABELS: Record<string, string> = {
    artist: "Artists",
    decade: "Decades",
    seasonal: "Seasonal",
  };

  return (
    <main className="flex flex-col items-center px-4 pt-[108px] pb-12">
      <div className="w-full max-w-[560px] flex flex-col gap-8">

        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-3">
            <h1 className="text-4xl font-bold tracking-tight">Quiz Library</h1>
            <p className="text-[color:var(--color-muted)]">
              Private prototype — not public yet. Same idea as TuneTwist&apos;s daily puzzle, organized
              by artist and decade, playable anytime. No daily limit.
            </p>
          </div>
          <form action={previewLogout}>
            <button type="submit" className="text-xs text-[color:var(--color-muted)] hover:text-white transition-colors whitespace-nowrap">
              Exit preview
            </button>
          </form>
        </div>

        {Object.entries(grouped).map(([kind, entries]) => (
          <div key={kind} className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-[color:var(--color-muted)]">{KIND_LABELS[kind] ?? kind}</p>
            <div className="flex flex-col gap-3">
              {entries.map(({ pack, songs }) => (
                <Link
                  key={pack.slug}
                  href={`/quizzes/${pack.slug}`}
                  className="flex flex-col gap-1 p-5 rounded-2xl bg-[color:var(--color-card)] border border-[color:var(--color-border)] hover:opacity-80 transition-opacity"
                >
                  <span className="text-lg font-bold text-white">{pack.heading}</span>
                  <span className="text-sm text-[color:var(--color-muted)]">{songs.length} songs</span>
                </Link>
              ))}
            </div>
          </div>
        ))}

        <p className="text-sm text-center text-[color:var(--color-muted)]">
          Looking for the live site?{" "}
          <Link href="/play" className="text-[color:var(--color-green)] font-semibold hover:opacity-80 transition-opacity">
            Play today&apos;s TuneTwist →
          </Link>
        </p>

      </div>
    </main>
  );
}
