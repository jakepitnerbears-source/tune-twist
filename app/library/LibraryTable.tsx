"use client";

import { useState, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Song } from "@/data/puzzles";

const DIFFICULTY_ORDER = ["easy", "medium", "hard", "viral"];

const DIFF_COLORS: Record<string, string> = {
  easy: "text-[color:var(--color-green)]",
  medium: "text-yellow-400",
  hard: "text-[color:var(--color-coral)]",
  viral: "text-[color:var(--color-purple)]",
};

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

type SortKey = "title" | "artist" | "year" | "genre" | "difficulty";
type SortDir = "asc" | "desc";

const ALL_GENRES = ["Pop", "R&B", "Hip-Hop", "Rock", "Alternative", "Indie", "Electronic", "Country", "Metal", "Funk/Disco", "Latin", "Pop-Punk"];

const GENRE_HEX: Record<string, string> = {
  "Pop":         "#f472b6",
  "R&B":         "#fb923c",
  "Hip-Hop":     "#facc15",
  "Rock":        "#f87171",
  "Alternative": "#fb7185",
  "Indie":       "#a3e635",
  "Electronic":  "#22d3ee",
  "Country":     "#fbbf24",
  "Metal":       "#a1a1aa",
  "Funk/Disco":  "#c084fc",
  "Latin":       "#34d399",
  "Pop-Punk":    "#e879f9",
};

function SortButton({ label, sortKey, current, dir, onClick }: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: SortDir;
  onClick: (k: SortKey) => void;
}) {
  const active = current === sortKey;
  return (
    <th className="pb-2 pr-6">
      <button
        onClick={() => onClick(sortKey)}
        className={`flex items-center gap-1 text-xs font-semibold uppercase tracking-widest transition-colors ${
          active ? "text-white" : "text-[color:var(--color-muted)] hover:text-white"
        }`}
      >
        {label}
        <span className="text-[10px] opacity-60">
          {active ? (dir === "asc" ? "↑" : "↓") : "↕"}
        </span>
      </button>
    </th>
  );
}

export default function LibraryTable({ songs }: { songs: Song[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("difficulty");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [filterGenre, setFilterGenre] = useState("");
  const [filterDiff, setFilterDiff] = useState("");
  const [search, setSearch] = useState("");

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const filtered = useMemo(() => {
    let list = [...songs];
    if (filterGenre) list = list.filter((s) => s.genre === filterGenre);
    if (filterDiff) list = list.filter((s) => s.difficulty === filterDiff);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.artist.toLowerCase().includes(q) ||
          s.synonymTitle.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "title") cmp = a.title.localeCompare(b.title);
      else if (sortKey === "artist") cmp = a.artist.localeCompare(b.artist);
      else if (sortKey === "year") cmp = Number(a.releaseYear) - Number(b.releaseYear);
      else if (sortKey === "genre") cmp = (a.genre ?? "").localeCompare(b.genre ?? "");
      else if (sortKey === "difficulty") {
        cmp = DIFFICULTY_ORDER.indexOf(a.difficulty) - DIFFICULTY_ORDER.indexOf(b.difficulty);
        if (cmp === 0) cmp = a.title.localeCompare(b.title);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [songs, sortKey, sortDir, filterGenre, filterDiff, search]);

  const counts = DIFFICULTY_ORDER.map((d) => ({
    d,
    n: songs.filter((s) => s.difficulty === d).length,
  }));

  const genreCounts = useMemo(() =>
    ALL_GENRES
      .map((g) => ({ g, n: songs.filter((s) => s.genre === g).length }))
      .sort((a, b) => b.n - a.n),
    [songs]
  );

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Song Library</h1>
        <p className="text-[color:var(--color-muted)] text-sm mt-1">
          {songs.length} songs total &nbsp;·&nbsp;
          {counts.map(({ d, n }) => (
            <span key={d} className={`${DIFF_COLORS[d]} mr-3`}>{n} {d}</span>
          ))}
        </p>
      </div>

      {/* Genre counts */}
      <div className="flex flex-wrap gap-2">
        {genreCounts.map(({ g, n }) => {
          const color = GENRE_COLORS[g] ?? "bg-zinc-500/20 text-zinc-300";
          const active = filterGenre === g;
          return (
            <button
              key={g}
              onClick={() => setFilterGenre(active ? "" : g)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full transition-all ${color} ${
                active ? "ring-2 ring-white/40" : "opacity-80 hover:opacity-100"
              }`}
            >
              {g}
              <span className="opacity-70">{n}</span>
            </button>
          );
        })}
      </div>

      {/* Pie chart */}
      <div className="flex gap-8 items-center bg-[color:var(--color-card)] border border-[color:var(--color-border)] rounded-2xl p-6">
        <div className="w-48 h-48 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={genreCounts.filter(({ n }) => n > 0)}
                dataKey="n"
                nameKey="g"
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={88}
                paddingAngle={2}
                strokeWidth={0}
              >
                {genreCounts.filter(({ n }) => n > 0).map(({ g }) => (
                  <Cell key={g} fill={GENRE_HEX[g] ?? "#71717a"} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 }}
                formatter={(value: number, name: string) => [`${value} songs`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
          {genreCounts.filter(({ n }) => n > 0).map(({ g, n }) => (
            <button
              key={g}
              onClick={() => setFilterGenre(filterGenre === g ? "" : g)}
              className={`flex items-center gap-2 text-left transition-opacity ${filterGenre && filterGenre !== g ? "opacity-40" : "opacity-100"}`}
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: GENRE_HEX[g] ?? "#71717a" }} />
              <span className="text-white font-medium">{g}</span>
              <span className="text-[color:var(--color-muted)] ml-auto pl-2">{n} ({((n / songs.length) * 100).toFixed(1)}%)</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search title, artist, synonym…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="text-sm px-3 py-1.5 rounded-lg bg-[color:var(--color-card)] border border-[color:var(--color-border)] text-white placeholder:text-[color:var(--color-muted)] outline-none focus:border-white/30 w-64"
        />

        <select
          value={filterGenre}
          onChange={(e) => setFilterGenre(e.target.value)}
          className="text-sm px-3 py-1.5 rounded-lg bg-[color:var(--color-card)] border border-[color:var(--color-border)] text-white outline-none focus:border-white/30"
        >
          <option value="">All genres</option>
          {ALL_GENRES.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>

        <select
          value={filterDiff}
          onChange={(e) => setFilterDiff(e.target.value)}
          className="text-sm px-3 py-1.5 rounded-lg bg-[color:var(--color-card)] border border-[color:var(--color-border)] text-white outline-none focus:border-white/30"
        >
          <option value="">All difficulties</option>
          {DIFFICULTY_ORDER.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        {(filterGenre || filterDiff || search) && (
          <button
            onClick={() => { setFilterGenre(""); setFilterDiff(""); setSearch(""); }}
            className="text-xs text-[color:var(--color-muted)] hover:text-white px-3 py-1.5 rounded-lg border border-[color:var(--color-border)] transition-colors"
          >
            Clear
          </button>
        )}

        <span className="ml-auto text-xs text-[color:var(--color-muted)]">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left border-b border-[color:var(--color-border)]">
            <th className="pb-2 pr-4 text-xs font-semibold uppercase tracking-widest text-[color:var(--color-muted)] w-[28px]">#</th>
            <SortButton label="Title"      sortKey="title"      current={sortKey} dir={sortDir} onClick={handleSort} />
            <SortButton label="Artist"     sortKey="artist"     current={sortKey} dir={sortDir} onClick={handleSort} />
            <th className="pb-2 pr-6 text-xs font-semibold uppercase tracking-widest text-[color:var(--color-muted)]">Synonym</th>
            <SortButton label="Genre"      sortKey="genre"      current={sortKey} dir={sortDir} onClick={handleSort} />
            <SortButton label="Year"       sortKey="year"       current={sortKey} dir={sortDir} onClick={handleSort} />
            <SortButton label="Difficulty" sortKey="difficulty" current={sortKey} dir={sortDir} onClick={handleSort} />
          </tr>
        </thead>
        <tbody>
          {filtered.map((song, i) => {
            const genreColor = GENRE_COLORS[song.genre ?? ""] ?? "bg-zinc-500/20 text-zinc-300";
            return (
              <tr
                key={song.id}
                className="border-b border-[color:var(--color-border)] hover:bg-[color:var(--color-card)] transition-colors"
              >
                <td className="py-2 pr-4 text-[color:var(--color-muted)] tabular-nums">{i + 1}</td>
                <td className="py-2 pr-6 font-semibold text-white whitespace-nowrap">{song.title}</td>
                <td className="py-2 pr-6 text-[color:var(--color-muted)] whitespace-nowrap">{song.artist}</td>
                <td className="py-2 pr-6 text-white">{song.synonymTitle}</td>
                <td className="py-2 pr-6">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${genreColor}`}>
                    {song.genre ?? "—"}
                  </span>
                </td>
                <td className="py-2 pr-6 text-[color:var(--color-muted)] tabular-nums">{song.releaseYear}</td>
                <td className={`py-2 font-semibold whitespace-nowrap ${DIFF_COLORS[song.difficulty]}`}>{song.difficulty}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {filtered.length === 0 && (
        <p className="text-center text-[color:var(--color-muted)] py-10">No songs match your filters.</p>
      )}

    </div>
  );
}
