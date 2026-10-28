"use client";

import { useState } from "react";
import PreviewCard from "./PreviewCard";
import { saveSongDraft, publishSongDraft, discardSongDraft } from "@/app/actions/content-manager";
import type { DraftPatch } from "@/lib/contentDrafts";

export interface CatalogSideEditorProps {
  catalog: "daily" | "quiz";
  id: string;
  isNew?: boolean;
  initialSynonymTitle: string;
  initialHints: [string, string];
  initialQuizzes?: string[];
  initialArchived?: boolean;
  availablePacks?: { slug: string; heading: string }[];
  pending?: DraftPatch;
  requireConfirmOnPublish?: string;
  onPublished?: () => void;
}

export default function CatalogSideEditor({
  catalog,
  id,
  isNew,
  initialSynonymTitle,
  initialHints,
  initialQuizzes = [],
  initialArchived = false,
  availablePacks = [],
  pending,
  requireConfirmOnPublish,
  onPublished,
}: CatalogSideEditorProps) {
  const draftRecord = (pending?.draftRecord ?? {}) as Record<string, unknown>;
  const [synonymTitle, setSynonymTitle] = useState((draftRecord.synonymTitle as string) ?? initialSynonymTitle);
  const [hint1, setHint1] = useState((draftRecord.hints as string[])?.[0] ?? initialHints[0]);
  const [hint2, setHint2] = useState((draftRecord.hints as string[])?.[1] ?? initialHints[1]);
  const [quizzes, setQuizzes] = useState<string[]>((draftRecord.quizzes as string[]) ?? initialQuizzes);
  const [archived, setArchived] = useState((draftRecord.archived as boolean) ?? initialArchived);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState(!!pending);
  const [expanded, setExpanded] = useState(false);

  function togglePack(slug: string) {
    setQuizzes((qs) => (qs.includes(slug) ? qs.filter((s) => s !== slug) : [...qs, slug]));
  }

  async function handleSave() {
    setBusy(true);
    setMessage(null);
    const record: Record<string, unknown> = { synonymTitle, hints: [hint1, hint2] };
    if (catalog === "quiz") {
      record.quizzes = quizzes;
      record.archived = archived;
    }
    const res = await saveSongDraft(catalog, id, !!isNew, record);
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
    const res = await publishSongDraft(catalog, id);
    setBusy(false);
    if (res.ok) {
      setHasDraft(false);
      setMessage("Published.");
      onPublished?.();
    } else {
      setMessage(res.reason);
    }
  }

  async function handleDiscard() {
    setBusy(true);
    setMessage(null);
    const res = await discardSongDraft(catalog, id);
    setBusy(false);
    if (res.ok) {
      setHasDraft(false);
      setSynonymTitle(initialSynonymTitle);
      setHint1(initialHints[0]);
      setHint2(initialHints[1]);
      setQuizzes(initialQuizzes);
      setArchived(initialArchived);
      setMessage("Draft discarded.");
    } else {
      setMessage(res.reason);
    }
  }

  if (!expanded) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-white truncate max-w-[180px]">{synonymTitle}</span>
        {hasDraft && <span className="text-xs text-amber-400 whitespace-nowrap">● draft</span>}
        <button onClick={() => setExpanded(true)} className="text-xs text-[color:var(--color-green)] hover:opacity-80 whitespace-nowrap">
          Edit
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 min-w-[260px] p-3 rounded-xl bg-white/5 border border-[color:var(--color-border)]">
      <div className="flex flex-col gap-1">
        <label className="text-[10px] uppercase tracking-wide text-[color:var(--color-muted)]">Synonym title</label>
        <input
          value={synonymTitle}
          onChange={(e) => setSynonymTitle(e.target.value)}
          className="px-2 py-1 rounded-md bg-[color:var(--color-navy)] border border-[color:var(--color-border)] text-xs text-white"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] uppercase tracking-wide text-[color:var(--color-muted)]">Hint 1</label>
        <input value={hint1} onChange={(e) => setHint1(e.target.value)} className="px-2 py-1 rounded-md bg-[color:var(--color-navy)] border border-[color:var(--color-border)] text-xs text-white" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] uppercase tracking-wide text-[color:var(--color-muted)]">Hint 2</label>
        <input value={hint2} onChange={(e) => setHint2(e.target.value)} className="px-2 py-1 rounded-md bg-[color:var(--color-navy)] border border-[color:var(--color-border)] text-xs text-white" />
      </div>

      {catalog === "quiz" && (
        <>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-wide text-[color:var(--color-muted)]">Quiz packs</label>
            <div className="flex flex-wrap gap-2">
              {availablePacks.map((p) => (
                <label key={p.slug} className="flex items-center gap-1 text-xs text-[color:var(--color-muted)]">
                  <input type="checkbox" checked={quizzes.includes(p.slug)} onChange={() => togglePack(p.slug)} />
                  {p.heading}
                </label>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-1 text-xs text-[color:var(--color-muted)]">
            <input type="checkbox" checked={archived} onChange={(e) => setArchived(e.target.checked)} />
            Archived (hidden from all packs, kept for history)
          </label>
        </>
      )}

      <PreviewCard synonymTitle={synonymTitle} hints={[hint1, hint2]} />

      <div className="flex gap-2 flex-wrap">
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
        <button onClick={() => setExpanded(false)} className="text-xs text-[color:var(--color-muted)] hover:text-white">
          Collapse
        </button>
      </div>
      {message && <span className="text-xs text-[color:var(--color-muted)]">{message}</span>}
    </div>
  );
}
