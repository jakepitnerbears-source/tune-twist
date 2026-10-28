"use client";

import { useState } from "react";
import { fetchCatalogHistory, rollbackCatalogToCommit } from "@/app/actions/content-manager";
import type { HistoryEntry } from "@/lib/contentDrafts";

export default function CatalogHistoryPanel({ catalog, label, onRolledBack }: { catalog: "daily" | "quiz"; label: string; onRolledBack: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busySha, setBusySha] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleOpen() {
    setOpen((o) => !o);
    if (history || loading) return;
    setLoading(true);
    const res = await fetchCatalogHistory(catalog);
    setLoading(false);
    if (res.ok) setHistory(res.history);
    else setError(res.reason);
  }

  async function handleRollback(sha: string, message_: string) {
    if (!window.confirm(`Roll back ${label} to commit ${sha.slice(0, 7)} ("${message_}")? This creates a new commit restoring that version — nothing is deleted.`)) {
      return;
    }
    setBusySha(sha);
    setMessage(null);
    const res = await rollbackCatalogToCommit(catalog, sha);
    setBusySha(null);
    if (res.ok) {
      setMessage("Rolled back. Refreshing...");
      setHistory(null);
      onRolledBack();
    } else {
      setMessage(res.reason);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button onClick={handleOpen} className="text-xs font-semibold text-[color:var(--color-muted)] hover:text-white underline underline-offset-2 w-fit">
        {open ? "Hide" : "View"} {label} history
      </button>
      {open && (
        <div className="flex flex-col gap-2 p-3 rounded-xl bg-white/5 border border-[color:var(--color-border)] max-w-md">
          {loading && <p className="text-xs text-[color:var(--color-muted)]">Loading...</p>}
          {error && <p className="text-xs text-red-400">{error}</p>}
          {history?.length === 0 && <p className="text-xs text-[color:var(--color-muted)]">No history found.</p>}
          {history?.map((h) => (
            <div key={h.sha} className="flex items-center justify-between gap-2 text-xs">
              <div className="flex flex-col">
                <span className="text-white">{h.message}</span>
                <span className="text-[color:var(--color-muted)]">{h.sha.slice(0, 7)} · {new Date(h.date).toLocaleString()}</span>
              </div>
              <button
                disabled={busySha === h.sha}
                onClick={() => handleRollback(h.sha, h.message)}
                className="text-[color:var(--color-purple)] hover:opacity-80 disabled:opacity-40 whitespace-nowrap"
              >
                Roll back to this
              </button>
            </div>
          ))}
          {message && <p className="text-xs text-[color:var(--color-muted)]">{message}</p>}
        </div>
      )}
    </div>
  );
}
