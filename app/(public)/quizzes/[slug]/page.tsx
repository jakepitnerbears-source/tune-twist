import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { loadQuizPacks, getQuizPack, getQuizPackSongs } from "@/lib/quiz/catalog";
import QuizEngine from "@/components/QuizEngine";

export function generateStaticParams() {
  return loadQuizPacks()
    .filter((p) => getQuizPackSongs(p.slug).length > 0)
    .map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const pack = getQuizPack(slug);
  if (!pack) return {};
  return {
    title: pack.title,
    description: pack.description,
    robots: { index: false, follow: false, nocache: true },
    openGraph: {
      title: pack.title,
      description: pack.description,
      url: `https://tunetwist.io/quizzes/${pack.slug}`,
      siteName: "TuneTwist",
      type: "website",
    },
  };
}

const QUIZ_JSON_LD = (pack: { heading: string; description: string }) => ({
  "@context": "https://schema.org",
  "@type": "Quiz",
  name: pack.heading,
  description: pack.description,
  isAccessibleForFree: true,
});

export default async function QuizPackPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pack = getQuizPack(slug);
  if (!pack) notFound();

  const songs = getQuizPackSongs(pack.slug);
  if (songs.length === 0) notFound();

  const clientSongs = songs.map((s) => ({ id: s.id, synonymTitle: s.synonymTitle }));

  return (
    <main className="flex flex-col items-center px-4 pt-[108px] pb-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(QUIZ_JSON_LD(pack)) }} />
      <div className="w-full max-w-[560px] flex flex-col gap-8">

        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-bold tracking-tight">{pack.heading}</h1>
          <p className="text-[color:var(--color-muted)]">{pack.intro}</p>
        </div>

        <QuizEngine slug={pack.slug} allSongs={clientSongs} />

        <div className="flex flex-col gap-2 text-sm text-center text-[color:var(--color-muted)]">
          <p>
            Want a fresh puzzle every day instead?{" "}
            <Link href="/play" className="text-[color:var(--color-green)] font-semibold hover:opacity-80 transition-opacity">
              Play Today&apos;s TuneTwist →
            </Link>
          </p>
          <p>
            <Link href="/quizzes" className="text-[color:var(--color-green)] font-semibold hover:opacity-80 transition-opacity">
              Browse All Quizzes →
            </Link>
          </p>
        </div>

      </div>
    </main>
  );
}
