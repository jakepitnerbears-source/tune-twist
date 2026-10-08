import { redirect } from "next/navigation";
import { loadDailyCatalog, loadQuizCatalog, loadQuizPacks } from "@/lib/quiz/catalog";
import { loadDrafts } from "@/lib/contentDrafts";
import { buildContentRows } from "@/lib/contentManagerRows";
import { getContentsConfig } from "@/lib/githubContent";
import { hasAdminAccess } from "@/lib/adminAuth";
import ContentManagerTable from "@/components/ContentManagerTable";

export const dynamic = "force-dynamic";

export default async function ContentManagerPage() {
  // Defense in depth behind proxy.ts's /admin gate — see the Next.js proxy docs' warning
  // that route changes can silently stop a matcher from covering a given page.
  if (!(await hasAdminAccess())) {
    redirect("/admin/login?from=%2Fadmin%2Fcontent-manager");
  }

  const daily = loadDailyCatalog();
  const quiz = loadQuizCatalog();
  const packs = loadQuizPacks().map((p) => ({ slug: p.slug, heading: p.heading }));
  const drafts = await loadDrafts();
  const rows = buildContentRows(daily, quiz, drafts);
  const persistenceConfigured = getContentsConfig() !== null;

  return (
    <div className="flex flex-col gap-6 px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Content Manager</h1>
        <p className="text-sm text-[color:var(--color-muted)]">
          Daily Songs + Quiz Songs, unified. {rows.length} songs total ({daily.length} daily, {quiz.length} quiz).
        </p>
        {!persistenceConfigured && (
          <p className="text-sm text-amber-400 bg-amber-950/40 border border-amber-800 rounded-lg px-3 py-2 mt-2">
            CONTENT_GITHUB_TOKEN / CONTENT_GITHUB_BRANCH aren&apos;t configured yet — you can browse, search, and try
            the editors below, but Save Draft / Publish / Rollback won&apos;t persist anywhere until that&apos;s set up
            (see docs/content-manager-architecture.md for exact setup steps).
          </p>
        )}
      </div>
      <ContentManagerTable rows={rows} packs={packs} />
    </div>
  );
}
