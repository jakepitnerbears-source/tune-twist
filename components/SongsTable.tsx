"use client";

import { useState, useMemo, useEffect } from "react";

type Row = {
  id: string;
  title: string;
  artist: string;
  synonymTitle: string;
  genre: string;
  releaseYear: string;
  scheduledDate: string;
  noSecondaryHint: boolean;
};

type Tag = "Remove" | "Redo Synonym";
type SpecialFilter = "All" | "Tagged" | "No Secondary Hint";

const TAG_COLORS: Record<Tag, { bg: string; text: string; border: string }> = {
  "Remove":       { bg: "rgba(239,68,68,0.15)",  text: "#f87171", border: "rgba(239,68,68,0.4)" },
  "Redo Synonym": { bg: "rgba(251,146,60,0.15)", text: "#fb923c", border: "rgba(251,146,60,0.4)" },
};

const STORAGE_KEY = "song-tags";

function loadTags(): Record<string, Tag[]> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"); }
  catch { return {}; }
}

function saveTags(tags: Record<string, Tag[]>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tags));
}

function IconX() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="2" y1="2" x2="12" y2="12" />
      <line x1="12" y1="2" x2="2" y2="12" />
    </svg>
  );
}

function IconRefresh() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 7A5 5 0 1 1 9 2.5" />
      <polyline points="9 1 9 3.5 11.5 3.5" />
    </svg>
  );
}

export default function SongsTable({ rows }: { rows: Row[] }) {
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("All");
  const [tagFilter, setTagFilter] = useState<Tag | SpecialFilter>("All");
  const [tags, setTags] = useState<Record<string, Tag[]>>({});
  const [copied, setCopied] = useState(false);

  useEffect(() => { setTags(loadTags()); }, []);

  const genres = useMemo(() => {
    const seen = new Set<string>();
    for (const r of rows) if (r.genre) seen.add(r.genre);
    return ["All", ...Array.from(seen).sort()];
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter((r) => {
      const matchesGenre = genre === "All" || r.genre === genre;
      const matchesSearch = !q || r.title.toLowerCase().includes(q) || r.artist.toLowerCase().includes(q) || r.synonymTitle.toLowerCase().includes(q);
      const rowTags = tags[r.id] ?? [];
      const matchesTag =
        tagFilter === "All" ||
        (tagFilter === "Tagged" && rowTags.length > 0) ||
        (tagFilter === "No Secondary Hint" && r.noSecondaryHint) ||
        rowTags.includes(tagFilter as Tag);
      return matchesGenre && matchesSearch && matchesTag;
    });
  }, [rows, search, genre, tagFilter, tags]);

  const taggedCount = useMemo(() => rows.filter((r) => (tags[r.id]?.length ?? 0) > 0).length, [rows, tags]);
  const removeCount = useMemo(() => rows.filter((r) => tags[r.id]?.includes("Remove")).length, [rows, tags]);
  const redoCount = useMemo(() => rows.filter((r) => tags[r.id]?.includes("Redo Synonym")).length, [rows, tags]);
  const noSecondaryCount = useMemo(() => rows.filter((r) => r.noSecondaryHint).length, [rows]);

  function toggleTag(id: string, tag: Tag) {
    const existing = tags[id] ?? [];
    const next = { ...tags };
    if (existing.includes(tag)) {
      const updated = existing.filter((t) => t !== tag);
      if (updated.length === 0) delete next[id];
      else next[id] = updated;
    } else {
      next[id] = [...existing, tag];
    }
    saveTags(next);
    setTags(next);
  }

  function copyTagged() {
    const lines: string[] = [];
    for (const row of rows) {
      const rowTags = tags[row.id];
      if (!rowTags?.length) continue;
      lines.push(`[${rowTags.join(", ")}] ${row.title} — ${row.artist} (${row.synonymTitle})`);
    }
    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ width: "100%" }}>
      <div style={{ marginBottom: "1rem" }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#fff", marginBottom: "0.25rem" }}>Songs Library</h1>
        <p style={{ color: "var(--color-muted)", fontSize: "0.75rem" }}>
          Admin / vetting view — {rows.length} songs total{taggedCount > 0 ? ` · ${taggedCount} tagged` : ""}
        </p>
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <input
          type="text"
          placeholder="Search song, artist, synonym…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            fontSize: "0.8rem", padding: "0.35rem 0.65rem", borderRadius: "6px",
            background: "var(--color-card)", border: "1px solid var(--color-border)",
            color: "#fff", outline: "none", width: "240px",
          }}
        />
        <select
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          style={{
            fontSize: "0.8rem", padding: "0.35rem 0.65rem", borderRadius: "6px",
            background: "var(--color-card)", border: "1px solid var(--color-border)",
            color: "#fff", outline: "none", cursor: "pointer",
          }}
        >
          {genres.map((g) => <option key={g} value={g} style={{ background: "#0d0f1a" }}>{g}</option>)}
        </select>

        {/* Tag filter pills */}
        {(["All", "Tagged", "No Secondary Hint", "Remove", "Redo Synonym"] as const).map((t) => {
          const active = tagFilter === t;
          const color = t === "Remove" ? TAG_COLORS["Remove"] : t === "Redo Synonym" ? TAG_COLORS["Redo Synonym"] : null;
          const noSecondary = t === "No Secondary Hint";
          return (
            <button
              key={t}
              onClick={() => setTagFilter(active && t !== "All" ? "All" : t)}
              style={{
                fontSize: "0.7rem", fontWeight: 600, padding: "0.25rem 0.6rem",
                borderRadius: "9999px", cursor: "pointer", border: "1px solid",
                borderColor: active ? (noSecondary ? "rgba(123,97,255,0.6)" : (color?.border ?? "rgba(255,255,255,0.4)")) : "var(--color-border)",
                background: active ? (noSecondary ? "rgba(123,97,255,0.15)" : (color?.bg ?? "rgba(255,255,255,0.1)")) : "transparent",
                color: active ? (noSecondary ? "#a78bfa" : (color?.text ?? "#fff")) : "var(--color-muted)",
                transition: "all 0.12s",
              }}
            >
              {t}
              {t === "Tagged" && taggedCount > 0 ? ` (${taggedCount})` : ""}
              {t === "No Secondary Hint" ? ` (${noSecondaryCount})` : ""}
              {t === "Remove" && removeCount > 0 ? ` (${removeCount})` : ""}
              {t === "Redo Synonym" && redoCount > 0 ? ` (${redoCount})` : ""}
            </button>
          );
        })}

        <span style={{ fontSize: "0.75rem", color: "var(--color-muted)", marginLeft: "auto" }}>
          {filtered.length} of {rows.length}
        </span>

        {taggedCount > 0 && (
          <button
            onClick={copyTagged}
            style={{
              fontSize: "0.72rem", fontWeight: 600, padding: "0.3rem 0.75rem",
              borderRadius: "6px", cursor: "pointer",
              background: copied ? "rgba(34,197,94,0.2)" : "var(--color-card)",
              border: "1px solid var(--color-border)",
              color: copied ? "var(--color-green)" : "var(--color-muted)",
              transition: "all 0.15s",
            }}
          >
            {copied ? "Copied!" : "Copy tagged"}
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto", maxHeight: "80vh", border: "1px solid var(--color-border)", borderRadius: "8px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
          <thead>
            <tr style={{ background: "var(--color-card)", position: "sticky", top: 0, zIndex: 1 }}>
              {["#", "Title", "Artist", "Synonym", "Genre", "Year", "Scheduled Date", ""].map((col, i) => (
                <th
                  key={i}
                  style={{
                    textAlign: "left", padding: "0.5rem 0.75rem",
                    color: "var(--color-muted)", fontWeight: 600, fontSize: "0.68rem",
                    textTransform: "uppercase", letterSpacing: "0.07em",
                    borderBottom: "1px solid var(--color-border)", whiteSpace: "nowrap",
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => {
              const rowTags = tags[row.id] ?? [];
              const isRemove = rowTags.includes("Remove");
              const isRedo = rowTags.includes("Redo Synonym");
              const isNoSecondary = row.noSecondaryHint;
              const rowBg = isRemove ? "rgba(239,68,68,0.06)" : isRedo ? "rgba(251,146,60,0.06)" : isNoSecondary ? "rgba(123,97,255,0.04)" : "transparent";
              return (
                <tr
                  key={row.id}
                  style={{
                    borderBottom: "1px solid var(--color-border)",
                    background: rowBg,
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => { if (!isRemove && !isRedo) (e.currentTarget as HTMLElement).style.background = "var(--color-card)"; }}
                  onMouseLeave={(e) => { if (!isRemove && !isRedo) (e.currentTarget as HTMLElement).style.background = rowBg; }}
                >
                  <td style={{ padding: "0.4rem 0.75rem", color: "var(--color-muted)", fontVariantNumeric: "tabular-nums", width: "2rem" }}>{i + 1}</td>
                  <td style={{ padding: "0.4rem 0.75rem", color: "#fff", fontWeight: 600, whiteSpace: "nowrap" }}>{row.title}</td>
                  <td style={{ padding: "0.4rem 0.75rem", color: "var(--color-muted)", whiteSpace: "nowrap" }}>{row.artist}</td>
                  <td style={{ padding: "0.4rem 0.75rem", color: "#fff", maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.synonymTitle}</td>
                  <td style={{ padding: "0.4rem 0.75rem" }}>
                    <span style={{
                      fontSize: "0.68rem", fontWeight: 600, padding: "0.15rem 0.5rem",
                      borderRadius: "9999px", background: "rgba(255,255,255,0.08)",
                      color: "var(--color-muted)", whiteSpace: "nowrap",
                    }}>
                      {row.genre || "—"}
                    </span>
                  </td>
                  <td style={{ padding: "0.4rem 0.75rem", color: "var(--color-muted)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{row.releaseYear}</td>
                  <td style={{ padding: "0.4rem 0.75rem", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", color: row.scheduledDate === "—" ? "var(--color-muted)" : "var(--color-green)" }}>{row.scheduledDate}</td>
                  <td style={{ padding: "0.4rem 0.75rem", whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", gap: "0.35rem", justifyContent: "flex-end" }}>
                      <button
                        onClick={() => toggleTag(row.id, "Redo Synonym")}
                        title="Redo Synonym"
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "center",
                          width: "26px", height: "26px", borderRadius: "6px", cursor: "pointer",
                          border: `1px solid ${isRedo ? TAG_COLORS["Redo Synonym"].border : "var(--color-border)"}`,
                          background: isRedo ? TAG_COLORS["Redo Synonym"].bg : "transparent",
                          color: isRedo ? TAG_COLORS["Redo Synonym"].text : "var(--color-muted)",
                          transition: "all 0.12s",
                        }}
                      >
                        <IconRefresh />
                      </button>
                      <button
                        onClick={() => toggleTag(row.id, "Remove")}
                        title="Remove"
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "center",
                          width: "26px", height: "26px", borderRadius: "6px", cursor: "pointer",
                          border: `1px solid ${isRemove ? TAG_COLORS["Remove"].border : "var(--color-border)"}`,
                          background: isRemove ? TAG_COLORS["Remove"].bg : "transparent",
                          color: isRemove ? TAG_COLORS["Remove"].text : "var(--color-muted)",
                          transition: "all 0.12s",
                        }}
                      >
                        <IconX />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <p style={{ textAlign: "center", color: "var(--color-muted)", padding: "2.5rem 0", fontSize: "0.85rem" }}>
            No songs match your filters.
          </p>
        )}
      </div>
    </div>
  );
}
