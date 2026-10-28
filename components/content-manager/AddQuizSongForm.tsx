"use client";

import { useState } from "react";
import { saveSongDraft, publishSongDraft } from "@/app/actions/content-manager";

function slugify(title: string, artist: string): string {
  return `${title}-${artist}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AddQuizSongForm({ availablePacks, onSaved }: { availablePacks: { slug: string; heading: string }[]; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [releaseYear, setReleaseYear] = useState("");
  const [synonymTitle, setSynonymTitle] = useState("");
  const [hint1, setHint1] = useState("");
  const [hint2, setHint2] = useState("");
  const [quizzes, setQuizzes] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function togglePack(slug: string) {
    setQuizzes((qs) => (qs.includes(slug) ? qs.filter((s) => s !== slug) : [...qs, slug]));
  }

  function reset() {
    setTitle("");
    setArtist("");
    setReleaseYear("");
    setSynonymTitle("");
    setHint1("");
    setHint2("");
    setQuizzes([]);
  }

  async function handleSaveAsDraft() {
    if (!title.trim() || !artist.trim()) {
      setMessage("Title and artist are required.");
      return;
    }
    setBusy(true);
    setMessage(null);
    const id = slugify(title, artist);
    const res = await saveSongDraft("quiz", id, true, {
      id,
      title,
      artist,
      releaseYear,
      synonymTitle,
      hints: [hint1, hint2],
      quizzes,
      reviewStatus: "published",
      archived: false,
    });
    setBusy(false);
    if (res.ok) {
      setMessage(`Draft saved as "${id}". Publish it below in the table once you're happy with it.`);
      reset();
      onSaved();
    } else {
      setMessage(res.reason);
    }
  }

  async function handleSaveAndPublish() {
    if (!title.trim() || !artist.trim()) {
      setMessage("Title and artist are required.");
      return;
    }
    setBusy(true);
    setMessage(null);
    const id = slugify(title, artist);
    const saveRes = await saveSongDraft("quiz", id, true, {
      id,
      title,
      artist,
      releaseYear,
      synonymTitle,
      hints: [hint1, hint2],
      quizzes,
      reviewStatus: "published",
      archived: false,
    });
    if (!saveRes.ok) {
      setBusy(false);
      setMessage(saveRes.reason);
      return;
    }
    const publishRes = await publishSongDraft("quiz", id);
    setBusy(false);
    if (publishRes.ok) {
      setMessage(`Published "${id}".`);
      reset();
      onSaved();
    } else {
      setMessage(`Saved as draft, but publish failed: ${publishRes.reason}`);
      onSaved();
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[color:var(--color-purple)]/20 text-[color:var(--color-purple)] hover:bg-[color:var(--color-purple)]/30 transition-colors whitespace-nowrap"
      >
        + Add Quiz Song
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl bg-white/5 border border-[color:var(--color-border)]">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">New Quiz Song</p>
        <button onClick={() => setOpen(false)} className="text-xs text-[color:var(--color-muted)] hover:text-white">
          Close
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="px-2 py-1.5 rounded-md bg-[color:var(--color-navy)] border border-[color:var(--color-border)] text-xs text-white" />
        <input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Artist" className="px-2 py-1.5 rounded-md bg-[color:var(--color-navy)] border border-[color:var(--color-border)] text-xs text-white" />
        <input value={releaseYear} onChange={(e) => setReleaseYear(e.target.value)} placeholder="Release year" className="px-2 py-1.5 rounded-md bg-[color:var(--color-navy)] border border-[color:var(--color-border)] text-xs text-white" />
        <input value={synonymTitle} onChange={(e) => setSynonymTitle(e.target.value)} placeholder="Synonym title" className="px-2 py-1.5 rounded-md bg-[color:var(--color-navy)] border border-[color:var(--color-border)] text-xs text-white" />
        <input value={hint1} onChange={(e) => setHint1(e.target.value)} placeholder="Hint 1" className="px-2 py-1.5 rounded-md bg-[color:var(--color-navy)] border border-[color:var(--color-border)] text-xs text-white" />
        <input value={hint2} onChange={(e) => setHint2(e.target.value)} placeholder="Hint 2" className="px-2 py-1.5 rounded-md bg-[color:var(--color-navy)] border border-[color:var(--color-border)] text-xs text-white" />
      </div>
      <div className="flex flex-wrap gap-2">
        {availablePacks.map((p) => (
          <label key={p.slug} className="flex items-center gap-1 text-xs text-[color:var(--color-muted)]">
            <input type="checkbox" checked={quizzes.includes(p.slug)} onChange={() => togglePack(p.slug)} />
            {p.heading}
          </label>
        ))}
      </div>
      <div className="flex gap-3">
        <button disabled={busy} onClick={handleSaveAsDraft} className="text-xs font-semibold text-[color:var(--color-green)] hover:opacity-80 disabled:opacity-40">
          Save as Draft
        </button>
        <button disabled={busy} onClick={handleSaveAndPublish} className="text-xs font-semibold text-[color:var(--color-purple)] hover:opacity-80 disabled:opacity-40">
          Save &amp; Publish Now
        </button>
      </div>
      {message && <p className="text-xs text-[color:var(--color-muted)]">{message}</p>}
    </div>
  );
}
