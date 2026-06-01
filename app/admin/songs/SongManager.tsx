"use client";

import { useState, useMemo } from "react";
import { Song } from "@/data/puzzles";

const GENRE_COLORS: Record<string, string> = {
  "Pop":         "bg-pink-500/20 text-pink-300",
  "R&B":         "bg-orange-500/20 text-orange-300",
  "Hip-Hop":     "bg-yellow-500/20 text-yellow-300",
  "Rock":        "bg-red-500/20 text-red-400",
  "Alternative": "bg-rose-500/20 text-rose-300",
  "Indie":       "bg-lime-500/20 text-lime-300",
  "Electronic":  "bg-cyan-500/20 text-cyan-300",
  "Country":     "bg-amber-500/20 text-amber-300",
  "Metal":       "bg-zinc-500/20 text-zinc-300",
  "Funk/Disco":  "bg-purple-500/20 text-purple-300",
  "Latin":       "bg-emerald-500/20 text-emerald-300",
  "Pop-Punk":    "bg-fuchsia-500/20 text-fuchsia-300",
};

type Status = "remove" | "redo-synonym" | null;
type FilterMode = "all" | "remove" | "redo-synonym" | "clean";

export default function SongManager({ initialSongs }: { initialSongs: Song[] }) {
  const [songs, setSongs] = useState(initialSongs);
  const [saving, setSaving] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [search, setSearch] = useState("");
  const [genreFilter, setGenreFilter] = useState("all");

  const genres = useMemo(
    () => Array.from(new Set(songs.map((s) => s.genre ?? "Other"))).sort(),
    [songs]
  );

  const filtered = useMemo(() => {
    return songs.filter((s) => {
      if (filter === "remove" && s.status !== "remove") return false;
      if (filter === "redo-synonym" && s.status !== "redo-synonym") return false;
      if (filter === "clean" && s.status != null) return false;
      if (genreFilter !== "all" && (s.genre ?? "Other") !== genreFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!s.title.toLowerCase().includes(q) && !s.artist.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [songs, filter, search, genreFilter]);

  const counts = useMemo(() => ({
    remove: songs.filter((s) => s.status === "remove").length,
    redo: songs.filter((s) => s.status === "redo-synonym").length,
    clean: songs.filter((s) => !s.status).length,
  }), [songs]);

  async function setStatus(id: string, status: Status) {
    setSaving(id);
    try {
      const res = await fetch("/api/admin/song-status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setSongs((prev) =>
          prev.map((s) => {
            if (s.id !== id) return s;
            const updated = { ...s };
            if (status === null) delete updated.status;
            else updated.status = status;
            return updated;
          })
        );
      }
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Flagged: Remove", value: counts.remove, color: "text-red-400" },
          { label: "Redo Synonym", value: counts.redo, color: "text-yellow-400" },
          { label: "Clean", value: counts.clean, color: "text-[color:var(--color-green)]" },
        ].map(({ label, value, color }) => (
          <div key={label} className="flex flex-col gap-1 bg-[color:var(--color-card)] border border-[color:var(--color-border)] rounded-xl p-4">
            <span className={`text-2xl font-bold ${color}`}>{value}</span>
            <span className="text-xs text-[color:var(--color-muted)]">{label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(["all", "remove", "redo-synonym", "clean"] as FilterMode[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
              filter === f
                ? "bg-[color:var(--color-purple)] border-[color:var(--color-purple)] text-white"
                : "border-[color:var(--color-border)] text-[color:var(--color-muted)] hover:text-white"
            }`}
          >
            {f === "all" ? `All (${songs.length})` : f === "remove" ? `Remove (${counts.remove})` : f === "redo-synonym" ? `Redo Synonym (${counts.redo})` : `Clean (${counts.clean})`}
          </button>
        ))}
        <select
          value={genreFilter}
          onChange={(e) => setGenreFilter(e.target.value)}
          className="text-xs bg-[color:var(--color-card)] border border-[color:var(--color-border)] rounded-full px-3 py-1.5 text-[color:var(--color-muted)] outline-none"
        >
          <option value="all">All Genres</option>
          {genres.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <input
          type="text"
          placeholder="Search title or artist…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="text-xs bg-[color:var(--color-card)] border border-[color:var(--color-border)] rounded-full px-3 py-1.5 text-white outline-none focus:border-[color:var(--color-purple)] flex-1 min-w-[160px]"
        />
      </div>

      <p className="text-xs text-[color:var(--color-muted)]">{filtered.length} songs shown</p>

      {/* Song list */}
      <div className="flex flex-col gap-2">
        {filtered.map((song) => {
          const isSaving = saving === song.id;
          const statusColor =
            song.status === "remove" ? "border-red-500/50 bg-red-500/5" :
            song.status === "redo-synonym" ? "border-yellow-500/50 bg-yellow-500/5" :
            "border-[color:var(--color-border)]";

          return (
            <div
              key={song.id}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${statusColor}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold truncate">{song.title}</span>
                  {song.genre && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${GENRE_COLORS[song.genre] ?? "bg-zinc-500/20 text-zinc-300"}`}>
                      {song.genre}
                    </span>
                  )}
                  {song.status === "remove" && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 shrink-0">Remove</span>
                  )}
                  {song.status === "redo-synonym" && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 shrink-0">Redo Synonym</span>
                  )}
                </div>
                <p className="text-xs text-[color:var(--color-muted)] mt-0.5">
                  {song.artist} · {song.releaseYear} · <span className="text-white/60 italic">{song.synonymTitle}</span>
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  disabled={isSaving}
                  onClick={() => setStatus(song.id, song.status === "remove" ? null : "remove")}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                    song.status === "remove"
                      ? "bg-red-500/30 text-red-300 hover:bg-red-500/20"
                      : "bg-[color:var(--color-card)] text-[color:var(--color-muted)] hover:text-red-400 border border-[color:var(--color-border)]"
                  }`}
                >
                  Remove
                </button>
                <button
                  disabled={isSaving}
                  onClick={() => setStatus(song.id, song.status === "redo-synonym" ? null : "redo-synonym")}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                    song.status === "redo-synonym"
                      ? "bg-yellow-500/30 text-yellow-300 hover:bg-yellow-500/20"
                      : "bg-[color:var(--color-card)] text-[color:var(--color-muted)] hover:text-yellow-400 border border-[color:var(--color-border)]"
                  }`}
                >
                  Redo
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
