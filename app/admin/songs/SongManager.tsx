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

  const genreCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of songs) counts[s.genre ?? "Other"] = (counts[s.genre ?? "Other"] ?? 0) + 1;
    return counts;
  }, [songs]);

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
    <div className="flex flex-col gap-5">
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

      {/* Status filters */}
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
        <input
          type="text"
          placeholder="Search title or artist…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="text-xs bg-[color:var(--color-card)] border border-[color:var(--color-border)] rounded-full px-3 py-1.5 text-white outline-none focus:border-[color:var(--color-purple)] flex-1 min-w-[160px]"
        />
      </div>

      {/* Genre pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setGenreFilter("all")}
          className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
            genreFilter === "all"
              ? "bg-white/10 border-white/30 text-white"
              : "border-[color:var(--color-border)] text-[color:var(--color-muted)] hover:text-white"
          }`}
        >
          All Genres ({songs.length})
        </button>
        {genres.map((g) => (
          <button
            key={g}
            onClick={() => setGenreFilter(g)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
              genreFilter === g
                ? `${GENRE_COLORS[g] ?? "bg-zinc-500/20 text-zinc-300"} border-transparent opacity-100`
                : "border-[color:var(--color-border)] text-[color:var(--color-muted)] hover:text-white"
            }`}
          >
            {g} ({genreCounts[g] ?? 0})
          </button>
        ))}
      </div>

      <p className="text-xs text-[color:var(--color-muted)] -mt-2">{filtered.length} songs</p>

      {/* Spreadsheet table */}
      <div className="overflow-x-auto rounded-xl border border-[color:var(--color-border)]">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-[color:var(--color-border)] bg-[color:var(--color-card)]">
              <th className="text-left text-xs font-semibold text-[color:var(--color-muted)] uppercase tracking-wider px-4 py-2.5">Title</th>
              <th className="text-left text-xs font-semibold text-[color:var(--color-muted)] uppercase tracking-wider px-4 py-2.5">Artist</th>
              <th className="text-left text-xs font-semibold text-[color:var(--color-muted)] uppercase tracking-wider px-4 py-2.5">Year</th>
              <th className="text-left text-xs font-semibold text-[color:var(--color-muted)] uppercase tracking-wider px-4 py-2.5">Synonym</th>
              <th className="text-left text-xs font-semibold text-[color:var(--color-muted)] uppercase tracking-wider px-4 py-2.5">Genre</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((song, i) => {
              const isSaving = saving === song.id;
              const rowBg =
                song.status === "remove" ? "bg-red-500/5" :
                song.status === "redo-synonym" ? "bg-yellow-500/5" :
                i % 2 === 0 ? "bg-transparent" : "bg-white/[0.02]";

              return (
                <tr key={song.id} className={`border-b border-[color:var(--color-border)]/50 last:border-0 ${rowBg}`}>
                  <td className="px-4 py-2.5 font-semibold whitespace-nowrap">{song.title}</td>
                  <td className="px-4 py-2.5 text-[color:var(--color-muted)] whitespace-nowrap">{song.artist}</td>
                  <td className="px-4 py-2.5 text-[color:var(--color-muted)] whitespace-nowrap">{song.releaseYear}</td>
                  <td className="px-4 py-2.5 text-[color:var(--color-muted)] italic whitespace-nowrap">{song.synonymTitle}</td>
                  <td className="px-4 py-2.5">
                    {song.genre && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${GENRE_COLORS[song.genre] ?? "bg-zinc-500/20 text-zinc-300"}`}>
                        {song.genre}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5 justify-end">
                      <button
                        disabled={isSaving}
                        onClick={() => setStatus(song.id, song.status === "remove" ? null : "remove")}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
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
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                          song.status === "redo-synonym"
                            ? "bg-yellow-500/30 text-yellow-300 hover:bg-yellow-500/20"
                            : "bg-[color:var(--color-card)] text-[color:var(--color-muted)] hover:text-yellow-400 border border-[color:var(--color-border)]"
                        }`}
                      >
                        Redo
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
