"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ContentRow } from "@/lib/contentManagerRows";
import CatalogSideEditor from "./content-manager/CatalogSideEditor";
import AddQuizSongForm from "./content-manager/AddQuizSongForm";
import CatalogHistoryPanel from "./content-manager/CatalogHistoryPanel";

type Filter = "all" | "daily" | "quiz" | "overlap";

const STATUS_COLORS: Record<string, string> = {
  today: "text-red-400 bg-red-950/40 border-red-800",
  past: "text-[color:var(--color-muted)] bg-white/5 border-[color:var(--color-border)]",
  upcoming: "text-amber-400 bg-amber-950/40 border-amber-800",
  unscheduled: "text-[color:var(--color-muted)] bg-white/5 border-[color:var(--color-border)]",
};

export default function ContentManagerTable({
  rows,
  packs,
}: {
  rows: ContentRow[];
  packs: { slug: string; heading: string }[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const refresh = () => router.refresh();

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      if (filter === "daily" && !row.inDaily) return false;
      if (filter === "quiz" && !row.inQuiz) return false;
      if (filter === "overlap" && !(row.inDaily && row.inQuiz)) return false;
      if (search) {
        const q = search.toLowerCase();
        const haystack = `${row.title} ${row.artist} ${row.dailySynonymTitle ?? ""} ${row.quizSynonymTitle ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [rows, filter, search]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-full bg-white/5 p-1">
          {(["all", "daily", "quiz", "overlap"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full capitalize transition-colors ${
                filter === f ? "bg-[color:var(--color-purple)] text-white" : "text-[color:var(--color-muted)] hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title, artist, or synonym title..."
          className="flex-1 min-w-[220px] px-3 py-1.5 rounded-full bg-white/5 border border-[color:var(--color-border)] text-sm text-white placeholder:text-[color:var(--color-muted)]"
        />
        <span className="text-xs text-[color:var(--color-muted)] whitespace-nowrap">{filtered.length} of {rows.length}</span>
        <AddQuizSongForm availablePacks={packs} onSaved={refresh} />
      </div>

      <div className="flex gap-6">
        <CatalogHistoryPanel catalog="daily" label="Daily catalog" onRolledBack={refresh} />
        <CatalogHistoryPanel catalog="quiz" label="Quiz catalog" onRolledBack={refresh} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-[color:var(--color-border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-[color:var(--color-muted)] uppercase tracking-wide border-b border-[color:var(--color-border)]">
              <th className="px-3 py-2">Song</th>
              <th className="px-3 py-2">Source</th>
              <th className="px-3 py-2">Daily status</th>
              <th className="px-3 py-2">Quiz packs</th>
              <th className="px-3 py-2">Daily editor</th>
              <th className="px-3 py-2">Quiz editor</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.identity} className="border-b border-[color:var(--color-border)] align-top">
                <td className="px-3 py-3">
                  <div className="font-semibold text-white">{row.title}</div>
                  <div className="text-xs text-[color:var(--color-muted)]">{row.artist}</div>
                </td>
                <td className="px-3 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {row.inDaily && <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950/50 border border-cyan-800 text-cyan-300">Daily</span>}
                    {row.inQuiz && <span className="text-xs px-2 py-0.5 rounded-full bg-pink-950/50 border border-pink-800 text-pink-300">Quiz</span>}
                    {row.inDaily && row.inQuiz && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-950/50 border border-amber-800 text-amber-300">Overlap</span>
                    )}
                    {row.quizArchived && <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-[color:var(--color-muted)]">Archived</span>}
                    {row.pendingQuiz?.isNew && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950/50 border border-emerald-800 text-emerald-300">New (unpublished)</span>}
                  </div>
                </td>
                <td className="px-3 py-3">
                  {row.dailyStatus && (
                    <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${STATUS_COLORS[row.dailyStatus]}`}>
                      {row.dailyStatus}
                    </span>
                  )}
                </td>
                <td className="px-3 py-3 text-xs text-[color:var(--color-muted)]">{row.quizPacks?.join(", ") || "—"}</td>
                <td className="px-3 py-3">
                  {row.inDaily && row.dailyId && (
                    <CatalogSideEditor
                      catalog="daily"
                      id={row.dailyId}
                      initialSynonymTitle={row.dailySynonymTitle ?? ""}
                      initialHints={row.dailyHints ?? ["", ""]}
                      pending={row.pendingDaily}
                      onPublished={refresh}
                      requireConfirmOnPublish={
                        row.dailyStatus === "today"
                          ? "This puzzle is LIVE right now. Publishing changes the answer players are currently guessing. Continue?"
                          : row.dailyStatus === "past"
                            ? "This puzzle has already been played. Publishing won't un-publish wrong guesses players already made. Continue?"
                            : undefined
                      }
                    />
                  )}
                </td>
                <td className="px-3 py-3">
                  {row.inQuiz && row.quizId && (
                    <CatalogSideEditor
                      catalog="quiz"
                      id={row.quizId}
                      isNew={row.pendingQuiz?.isNew}
                      initialSynonymTitle={row.quizSynonymTitle ?? ""}
                      initialHints={row.quizHints ?? ["", ""]}
                      initialQuizzes={row.quizPacks ?? []}
                      initialArchived={row.quizArchived ?? false}
                      availablePacks={packs}
                      pending={row.pendingQuiz}
                      onPublished={refresh}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
