"use client";

import { useMemo, useState } from "react";
import type { ContentRow } from "@/lib/contentManagerRows";
import { saveSongDraft, publishSongDraft, discardSongDraft } from "@/app/actions/content-manager";

type Filter = "all" | "daily" | "quiz" | "overlap";

const STATUS_COLORS: Record<string, string> = {
  today: "text-red-400 bg-red-950/40 border-red-800",
  past: "text-[color:var(--color-muted)] bg-white/5 border-[color:var(--color-border)]",
  upcoming: "text-amber-400 bg-amber-950/40 border-amber-800",
  unscheduled: "text-[color:var(--color-muted)] bg-white/5 border-[color:var(--color-border)]",
};

function EditableSynonym({
  catalog,
  id,
  currentValue,
  pending,
  requireConfirmOnPublish,
}: {
  catalog: "daily" | "quiz";
  id: string;
  currentValue: string;
  pending?: { field: string; draftValue: string };
  requireConfirmOnPublish?: string;
}) {
  const [value, setValue] = useState(pending?.draftValue ?? currentValue);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState(!!pending);

  async function handleSave() {
    setBusy(true);
    setMessage(null);
    const res = await saveSongDraft(catalog, id, "synonymTitle", value);
    setBusy(false);
    if (res.ok) {
      setHasDraft(true);
      setMessage("Draft saved.");
    } else {
      setMessage(res.reason);
    }
  }

  async function handlePublish() {
    if (requireConfirmOnPublish && !window.confirm(requireConfirmOnPublish)) return;
    setBusy(true);
    setMessage(null);
    const res = await publishSongDraft(catalog, id, "synonymTitle");
    setBusy(false);
    if (res.ok) {
      setHasDraft(false);
      setMessage("Published.");
    } else {
      setMessage(res.reason);
    }
  }

  async function handleDiscard() {
    setBusy(true);
    setMessage(null);
    const res = await discardSongDraft(catalog, id, "synonymTitle");
    setBusy(false);
    if (res.ok) {
      setHasDraft(false);
      setValue(currentValue);
      setMessage("Draft discarded.");
    } else {
      setMessage(res.reason);
    }
  }

  return (
    <div className="flex flex-col gap-1 min-w-[220px]">
      <div className="flex items-center gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="px-2 py-1 rounded-md bg-[color:var(--color-navy)] border border-[color:var(--color-border)] text-xs text-white w-full"
        />
        {hasDraft && <span className="text-xs text-amber-400 whitespace-nowrap">● draft</span>}
      </div>
      <div className="flex gap-2">
        <button disabled={busy} onClick={handleSave} className="text-xs text-[color:var(--color-green)] hover:opacity-80 disabled:opacity-40">
          Save Draft
        </button>
        {hasDraft && (
          <>
            <button disabled={busy} onClick={handlePublish} className="text-xs text-[color:var(--color-purple)] hover:opacity-80 disabled:opacity-40">
              Publish
            </button>
            <button disabled={busy} onClick={handleDiscard} className="text-xs text-[color:var(--color-muted)] hover:text-white disabled:opacity-40">
              Discard
            </button>
          </>
        )}
      </div>
      {message && <span className="text-xs text-[color:var(--color-muted)]">{message}</span>}
    </div>
  );
}

export default function ContentManagerTable({ rows }: { rows: ContentRow[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

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
      </div>

      <div className="overflow-x-auto rounded-xl border border-[color:var(--color-border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-[color:var(--color-muted)] uppercase tracking-wide border-b border-[color:var(--color-border)]">
              <th className="px-3 py-2">Song</th>
              <th className="px-3 py-2">Source</th>
              <th className="px-3 py-2">Daily status</th>
              <th className="px-3 py-2">Quiz packs</th>
              <th className="px-3 py-2">Daily synonym title</th>
              <th className="px-3 py-2">Quiz synonym title</th>
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
                  </div>
                </td>
                <td className="px-3 py-3">
                  {row.dailyStatus && (
                    <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${STATUS_COLORS[row.dailyStatus]}`}>
                      {row.dailyStatus}
                    </span>
                  )}
                </td>
                <td className="px-3 py-3 text-xs text-[color:var(--color-muted)]">{row.quizPacks?.join(", ") ?? "—"}</td>
                <td className="px-3 py-3">
                  {row.inDaily && row.dailyId && (
                    <EditableSynonym
                      catalog="daily"
                      id={row.dailyId}
                      currentValue={row.dailySynonymTitle ?? ""}
                      pending={row.pendingDaily}
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
                    <EditableSynonym catalog="quiz" id={row.quizId} currentValue={row.quizSynonymTitle ?? ""} pending={row.pendingQuiz} />
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
