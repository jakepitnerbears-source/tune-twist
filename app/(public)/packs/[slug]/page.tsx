import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PACKS, getPack, getPackSongs } from "@/lib/packs";
import PackQuiz from "@/components/PackQuiz";

export function generateStaticParams() {
  return PACKS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const pack = getPack(slug);
  if (!pack) return {};
  return {
    title: pack.title,
    description: pack.description,
    alternates: {
      canonical: `/packs/${pack.slug}`,
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

export default async function PackPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pack = getPack(slug);
  if (!pack) notFound();

  const songs = getPackSongs(pack);
  const clientSongs = songs.map((s) => ({ id: s.id, synonymTitle: s.synonymTitle }));

  return (
    <main className="flex flex-col items-center px-4 pt-[108px] pb-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(QUIZ_JSON_LD(pack)) }} />
      <div className="w-full max-w-[560px] flex flex-col gap-8">

        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-bold tracking-tight">{pack.heading}</h1>
          <p className="text-[color:var(--color-muted)]">{pack.intro}</p>
        </div>

        <PackQuiz slug={pack.slug} allSongs={clientSongs} />

        <div className="flex flex-col gap-2 text-sm text-center text-[color:var(--color-muted)]">
          <p>
            Want a fresh puzzle every day instead?{" "}
            <Link href="/play" className="text-[color:var(--color-green)] font-semibold hover:opacity-80 transition-opacity">
              Play Today&apos;s TuneTwist →
            </Link>
          </p>
          <p>
            <Link href="/packs" className="text-[color:var(--color-green)] font-semibold hover:opacity-80 transition-opacity">
              Browse All Song Packs →
            </Link>
          </p>
        </div>

      </div>
    </main>
  );
}
