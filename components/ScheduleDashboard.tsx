"use client";

import { useState, useMemo } from "react";

type Song = {
  id: string;
  title: string;
  artist: string;
  synonymTitle: string;
  genre: string;
  releaseYear: string;
};

type Day = {
  dayIndex: number;
  date: string;
  songs: Song[];
};

const GENRE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  Pop:        { bg: "rgba(244,114,182,0.15)", text: "#f472b6", dot: "#f472b6" },
  Rock:       { bg: "rgba(251,146,60,0.15)",  text: "#fb923c", dot: "#fb923c" },
  "R&B":      { bg: "rgba(167,139,250,0.15)", text: "#a78bfa", dot: "#a78bfa" },
  "Hip-Hop":  { bg: "rgba(250,204,21,0.15)",  text: "#facc15", dot: "#facc15" },
  Country:    { bg: "rgba(251,191,36,0.15)",  text: "#fbbf24", dot: "#fbbf24" },
  Electronic: { bg: "rgba(34,211,238,0.15)",  text: "#22d3ee", dot: "#22d3ee" },
  Funk:       { bg: "rgba(163,230,53,0.15)",  text: "#a3e635", dot: "#a3e635" },
  Indie:      { bg: "rgba(94,234,212,0.15)",  text: "#5eead4", dot: "#5eead4" },
  "Pop-Punk": { bg: "rgba(251,113,133,0.15)", text: "#fb7185", dot: "#fb7185" },
  Unknown:    { bg: "rgba(255,255,255,0.05)", text: "rgba(255,255,255,0.4)", dot: "rgba(255,255,255,0.3)" },
};

const DECADE_COLORS: Record<string, string> = {
  "60s": "#818cf8", "70s": "#fb923c", "80s": "#f472b6",
  "90s": "#34d399", "00s": "#facc15", "10s": "#22d3ee", "20s": "#a78bfa",
};

function getColor(genre: string) {
  return GENRE_COLORS[genre] ?? GENRE_COLORS.Unknown;
}

function toDecade(year: string): string {
  const y = parseInt(year);
  if (isNaN(y)) return "?";
  const d = Math.floor(y / 10) * 10;
  if (d < 1970) return "60s";
  return `${String(d).slice(2)}s`;
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    month: "short", day: "numeric", timeZone: "UTC",
  });
}

function formatDateFull(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
  });
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: "0.75rem" }}>
      <h2 style={{ fontSize: "0.78rem", fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.08em" }}>{title}</h2>
      {subtitle && <p style={{ fontSize: "0.7rem", color: "var(--color-muted)", marginTop: "0.1rem" }}>{subtitle}</p>}
    </div>
  );
}

type NewSong = {
  id: string;
  title: string;
  artist: string;
  genre: string;
  releaseYear: string;
};

export default function ScheduleDashboard({ days, newSongs = [] }: { days: Day[]; newSongs?: NewSong[] }) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [genreFilter, setGenreFilter] = useState<string>("All");
  const [repeatsExpanded, setRepeatsExpanded] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const totalSongs = days.reduce((s, d) => s + d.songs.length, 0);

  const allSongs = useMemo(() => days.flatMap((d) => d.songs), [days]);

  // Genre totals
  const genreTotals = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of allSongs) counts[s.genre] = (counts[s.genre] ?? 0) + 1;
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [allSongs]);

  // Decade breakdown
  const decadeTotals = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of allSongs) {
      const dec = toDecade(s.releaseYear);
      counts[dec] = (counts[dec] ?? 0) + 1;
    }
    const order = ["60s", "70s", "80s", "90s", "00s", "10s", "20s", "?"];
    return order.filter((d) => counts[d]).map((d) => ({ decade: d, count: counts[d] }));
  }, [allSongs]);

  // Artist repeats
  const artistRepeats = useMemo(() => {
    const map: Record<string, { title: string; dayIndex: number; date: string }[]> = {};
    for (const day of days) {
      for (const song of day.songs) {
        if (!map[song.artist]) map[song.artist] = [];
        map[song.artist].push({ title: song.title, dayIndex: day.dayIndex, date: day.date });
      }
    }
    return Object.entries(map)
      .filter(([, appearances]) => appearances.length > 1)
      .sort((a, b) => b[1].length - a[1].length);
  }, [days]);

  // Weekly genre heatmap — 13 weeks of 7 days
  const weeks = useMemo(() => {
    const genres = genreTotals.map(([g]) => g);
    const result: { label: string; counts: Record<string, number>; total: number }[] = [];
    for (let w = 0; w < Math.ceil(days.length / 7); w++) {
      const slice = days.slice(w * 7, w * 7 + 7);
      const counts: Record<string, number> = {};
      for (const day of slice) {
        for (const song of day.songs) {
          counts[song.genre] = (counts[song.genre] ?? 0) + 1;
        }
      }
      const start = slice[0]?.date ?? "";
      const end = slice[slice.length - 1]?.date ?? "";
      result.push({
        label: `${formatDate(start)}–${formatDate(end)}`,
        counts,
        total: slice.reduce((s, d) => s + d.songs.length, 0),
      });
    }
    return { weeks: result, genres };
  }, [days, genreTotals]);

  const maxWeekGenreCount = useMemo(() => {
    let max = 0;
    for (const w of weeks.weeks) {
      for (const v of Object.values(w.counts)) if (v > max) max = v;
    }
    return max || 1;
  }, [weeks]);

  const TARGET = 600;

  // Combined library stats (original scheduled songs + new staging songs, deduped by id)
  const combinedStats = useMemo(() => {
    const scheduledIds = new Set(allSongs.map((s) => s.id));
    const uniqueNew = newSongs.filter((s) => !scheduledIds.has(s.id));
    const combined = [...allSongs, ...uniqueNew];
    const total = combined.length;

    // Genre counts split: orig vs new
    const origGenre: Record<string, number> = {};
    for (const s of allSongs) origGenre[s.genre] = (origGenre[s.genre] ?? 0) + 1;
    const newGenre: Record<string, number> = {};
    for (const s of uniqueNew) newGenre[s.genre] = (newGenre[s.genre] ?? 0) + 1;
    const allGenres = Array.from(new Set([...Object.keys(origGenre), ...Object.keys(newGenre)]));
    const genreRows = allGenres
      .map((g) => ({ genre: g, orig: origGenre[g] ?? 0, added: newGenre[g] ?? 0 }))
      .sort((a, b) => (b.orig + b.added) - (a.orig + a.added));

    // Era counts split
    const origEra: Record<string, number> = {};
    for (const s of allSongs) { const d = toDecade(s.releaseYear); origEra[d] = (origEra[d] ?? 0) + 1; }
    const newEra: Record<string, number> = {};
    for (const s of uniqueNew) { const d = toDecade(s.releaseYear); newEra[d] = (newEra[d] ?? 0) + 1; }
    const eraOrder = ["60s", "70s", "80s", "90s", "00s", "10s", "20s", "?"];
    const eraRows = eraOrder
      .filter((d) => (origEra[d] ?? 0) + (newEra[d] ?? 0) > 0)
      .map((d) => ({ decade: d, orig: origEra[d] ?? 0, added: newEra[d] ?? 0 }));

    return { total, genreRows, eraRows, newCount: uniqueNew.length };
  }, [allSongs, newSongs]);

  const filteredDays = useMemo(() => {
    if (genreFilter === "All") return days;
    return days.filter((d) => d.songs.some((s) => s.genre === genreFilter));
  }, [days, genreFilter]);

  const selectedDayData = selectedDay !== null ? days[selectedDay] : null;

  const card: React.CSSProperties = {
    background: "var(--color-card)",
    border: "1px solid var(--color-border)",
    borderRadius: "10px",
    padding: "1rem",
  };

  return (
    <div style={{ width: "100%", maxWidth: "1100px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#fff", marginBottom: "0.25rem" }}>Schedule Dashboard</h1>
        <p style={{ color: "var(--color-muted)", fontSize: "0.75rem" }}>
          {days.length} days · {totalSongs} songs · {days[0]?.date} → {days[days.length - 1]?.date}
        </p>
      </div>

      {/* Genre filter strip */}
      <div style={{ ...card, display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        <button
          onClick={() => setGenreFilter("All")}
          style={{
            fontSize: "0.72rem", fontWeight: 600, padding: "0.25rem 0.65rem", borderRadius: "9999px",
            border: "1px solid", cursor: "pointer",
            borderColor: genreFilter === "All" ? "#fff" : "var(--color-border)",
            background: genreFilter === "All" ? "rgba(255,255,255,0.12)" : "transparent",
            color: genreFilter === "All" ? "#fff" : "var(--color-muted)",
            transition: "all 0.15s",
          }}
        >
          All genres
        </button>
        {genreTotals.map(([genre, count]) => {
          const c = getColor(genre);
          const active = genreFilter === genre;
          return (
            <button key={genre} onClick={() => setGenreFilter(active ? "All" : genre)}
              style={{
                fontSize: "0.72rem", fontWeight: 600, padding: "0.25rem 0.65rem", borderRadius: "9999px",
                border: `1px solid ${active ? c.dot : "var(--color-border)"}`, cursor: "pointer",
                background: active ? c.bg : "transparent",
                color: active ? c.text : "var(--color-muted)",
                transition: "all 0.15s", display: "flex", alignItems: "center", gap: "0.35rem",
              }}
            >
              <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: c.dot, display: "inline-block", flexShrink: 0 }} />
              {genre}
              <span style={{ opacity: 0.6 }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Decade breakdown */}
      <div style={card}>
        <SectionHeader title="Era Breakdown" subtitle="Songs by release decade" />
        <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
          {decadeTotals.map(({ decade, count }) => {
            const pct = Math.round((count / totalSongs) * 100);
            const color = DECADE_COLORS[decade] ?? "#888";
            return (
              <div key={decade} style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <span style={{ fontSize: "0.68rem", fontWeight: 700, color, width: "28px", flexShrink: 0 }}>{decade}</span>
                <div style={{ flex: 1, height: "8px", background: "var(--color-border)", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: "4px", transition: "width 0.4s" }} />
                </div>
                <span style={{ fontSize: "0.68rem", color: "var(--color-muted)", width: "48px", textAlign: "right", flexShrink: 0 }}>
                  {count} <span style={{ opacity: 0.5 }}>({pct}%)</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Artist repeats — full width */}
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
          <div>
            <h2 style={{ fontSize: "0.78rem", fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.08em" }}>Artist Repeats</h2>
            <p style={{ fontSize: "0.7rem", color: "var(--color-muted)", marginTop: "0.1rem" }}>
              {artistRepeats.length === 0 ? "No duplicates — all clear" : `${artistRepeats.length} artist${artistRepeats.length > 1 ? "s" : ""} appear more than once`}
            </p>
          </div>
          {artistRepeats.length > 4 && (
            <button
              onClick={() => setRepeatsExpanded((v) => !v)}
              style={{ fontSize: "0.7rem", color: "var(--color-muted)", background: "transparent", border: "1px solid var(--color-border)", borderRadius: "6px", padding: "0.25rem 0.6rem", cursor: "pointer" }}
            >
              {repeatsExpanded ? "Show less ↑" : `Show all ${artistRepeats.length} ↓`}
            </button>
          )}
        </div>
        {artistRepeats.length === 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1rem" }}>✓</span>
            <span style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>Every artist appears exactly once.</span>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.5rem" }}>
            {(repeatsExpanded ? artistRepeats : artistRepeats.slice(0, 4)).map(([artist, appearances]) => (
              <div key={artist} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", padding: "0.5rem 0.7rem", borderRadius: "6px", background: "rgba(251,146,60,0.08)", border: "1px solid rgba(251,146,60,0.2)" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#fff", marginBottom: "0.25rem" }}>{artist}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                    {appearances.map((a, i) => (
                      <span key={i} style={{ fontSize: "0.65rem", color: "var(--color-muted)", display: "flex", gap: "0.35rem" }}>
                        <span style={{ color: "#fb923c", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{formatDate(a.date)}</span>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</span>
                      </span>
                    ))}
                  </div>
                </div>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#fb923c", flexShrink: 0, paddingTop: "0.1rem" }}>×{appearances.length}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weekly genre heatmap */}
      <div style={card}>
        <SectionHeader title="Weekly Genre Heatmap" subtitle="Song count per genre per week — darker = more songs" />
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", fontSize: "0.68rem", width: "100%" }}>
            <thead>
              <tr>
                <th style={{ padding: "0.3rem 0.5rem", color: "var(--color-muted)", textAlign: "left", fontWeight: 600, whiteSpace: "nowrap", minWidth: "110px" }}>Week</th>
                {weeks.genres.map((g) => {
                  const c = getColor(g);
                  return (
                    <th key={g} style={{ padding: "0.3rem 0.4rem", color: c.text, fontWeight: 700, textAlign: "center", whiteSpace: "nowrap" }}>{g}</th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {weeks.weeks.map((week, wi) => (
                <tr key={wi} style={{ borderTop: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "0.35rem 0.5rem", color: "var(--color-muted)", whiteSpace: "nowrap" }}>{week.label}</td>
                  {weeks.genres.map((g) => {
                    const count = week.counts[g] ?? 0;
                    const c = getColor(g);
                    const intensity = count / maxWeekGenreCount;
                    return (
                      <td key={g} style={{ padding: "0.35rem 0.4rem", textAlign: "center" }}>
                        {count > 0 ? (
                          <span
                            title={`${count} ${g} song${count > 1 ? "s" : ""}`}
                            style={{
                              display: "inline-flex", alignItems: "center", justifyContent: "center",
                              width: "26px", height: "22px", borderRadius: "4px",
                              background: `${c.dot}${Math.round(intensity * 220 + 35).toString(16).padStart(2, "0")}`,
                              color: intensity > 0.5 ? "#fff" : c.text,
                              fontWeight: 700, fontSize: "0.65rem",
                            }}
                          >
                            {count}
                          </span>
                        ) : (
                          <span style={{ color: "var(--color-border)", fontSize: "0.6rem" }}>—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Combined Library — Progress Toward 600 */}
      <div style={card}>
        <div style={{ marginBottom: "0.85rem" }}>
          <h2 style={{ fontSize: "0.78rem", fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Combined Library — Progress Toward 600
          </h2>
          <p style={{ fontSize: "0.7rem", color: "var(--color-muted)", marginTop: "0.1rem" }}>
            Original {totalSongs} songs · +{combinedStats.newCount} staging · {combinedStats.total} / {TARGET} total
          </p>
        </div>

        {/* Overall progress bar */}
        <div style={{ marginBottom: "1.1rem" }}>
          <div style={{ height: "10px", background: "var(--color-border)", borderRadius: "5px", overflow: "hidden", position: "relative" }}>
            <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${Math.min((totalSongs / TARGET) * 100, 100)}%`, background: "var(--color-green)", borderRadius: "5px" }} />
            <div style={{ position: "absolute", left: `${Math.min((totalSongs / TARGET) * 100, 100)}%`, top: 0, height: "100%", width: `${Math.min((combinedStats.newCount / TARGET) * 100, 100)}%`, background: "rgba(34,197,94,0.35)", borderRadius: "5px" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.3rem" }}>
            <span style={{ fontSize: "0.65rem", color: "var(--color-muted)" }}>
              <span style={{ color: "var(--color-green)", fontWeight: 700 }}>{combinedStats.total}</span> of {TARGET} songs
            </span>
            <span style={{ fontSize: "0.65rem", color: "var(--color-muted)" }}>{Math.round((combinedStats.total / TARGET) * 100)}%</span>
          </div>
        </div>

        {/* Genre breakdown — stacked bars */}
        <div style={{ marginBottom: "1.1rem" }}>
          <p style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>By Genre</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {combinedStats.genreRows.map(({ genre, orig, added }) => {
              const c = getColor(genre);
              const combined = orig + added;
              const origPct = (orig / TARGET) * 100;
              const addedPct = (added / TARGET) * 100;
              return (
                <div key={genre} style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <span style={{ fontSize: "0.65rem", fontWeight: 600, color: c.text, width: "68px", flexShrink: 0, textAlign: "right" }}>{genre}</span>
                  <div style={{ flex: 1, height: "8px", background: "var(--color-border)", borderRadius: "4px", overflow: "hidden", position: "relative" }}>
                    <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${origPct}%`, background: c.dot, borderRadius: "4px" }} />
                    {added > 0 && (
                      <div style={{ position: "absolute", left: `${origPct}%`, top: 0, height: "100%", width: `${addedPct}%`, background: c.dot, opacity: 0.4, borderRadius: "4px" }} />
                    )}
                  </div>
                  <span style={{ fontSize: "0.65rem", color: "var(--color-muted)", width: "72px", flexShrink: 0, textAlign: "right" }}>
                    {orig}{added > 0 ? <span style={{ color: c.text, opacity: 0.7 }}> +{added}</span> : ""} <span style={{ opacity: 0.45 }}>= {combined}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Era breakdown — stacked bars */}
        <div>
          <p style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>By Era</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {combinedStats.eraRows.map(({ decade, orig, added }) => {
              const color = DECADE_COLORS[decade] ?? "#888";
              const combined = orig + added;
              const origPct = (orig / TARGET) * 100;
              const addedPct = (added / TARGET) * 100;
              return (
                <div key={decade} style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <span style={{ fontSize: "0.68rem", fontWeight: 700, color, width: "28px", flexShrink: 0 }}>{decade}</span>
                  <div style={{ flex: 1, height: "8px", background: "var(--color-border)", borderRadius: "4px", overflow: "hidden", position: "relative" }}>
                    <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${origPct}%`, background: color, borderRadius: "4px" }} />
                    {added > 0 && (
                      <div style={{ position: "absolute", left: `${origPct}%`, top: 0, height: "100%", width: `${addedPct}%`, background: color, opacity: 0.4, borderRadius: "4px" }} />
                    )}
                  </div>
                  <span style={{ fontSize: "0.65rem", color: "var(--color-muted)", width: "72px", flexShrink: 0, textAlign: "right" }}>
                    {orig}{added > 0 ? <span style={{ color, opacity: 0.7 }}> +{added}</span> : ""} <span style={{ opacity: 0.45 }}>= {combined}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Day grid + detail panel */}
      <div style={{ display: "flex", gap: "1.25rem", alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: "0.5rem" }}>
            {filteredDays.map((day) => {
              const isToday = day.date === today;
              const isPast = day.date < today;
              const isSelected = selectedDay === day.dayIndex;
              return (
                <button key={day.dayIndex} onClick={() => setSelectedDay(isSelected ? null : day.dayIndex)}
                  style={{
                    padding: "0.6rem 0.5rem", borderRadius: "8px",
                    border: `1px solid ${isSelected ? "rgba(255,255,255,0.4)" : isToday ? "var(--color-green)" : "var(--color-border)"}`,
                    background: isSelected ? "rgba(255,255,255,0.08)" : isToday ? "rgba(34,197,94,0.08)" : "var(--color-card)",
                    cursor: "pointer", textAlign: "left", transition: "all 0.12s",
                    opacity: isPast && !isToday ? 0.55 : 1,
                  }}
                >
                  <div style={{ fontSize: "0.62rem", fontWeight: 700, color: isToday ? "var(--color-green)" : "var(--color-muted)", marginBottom: "0.35rem", letterSpacing: "0.04em" }}>
                    {isToday ? "TODAY" : formatDate(day.date)}
                  </div>
                  <div style={{ display: "flex", gap: "3px", flexWrap: "wrap" }}>
                    {day.songs.map((song) => (
                      <span key={song.id} title={`${song.title} — ${song.genre}`}
                        style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "2px", background: getColor(song.genre).dot, flexShrink: 0 }}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detail panel */}
        {selectedDayData && (
          <div style={{ width: "280px", flexShrink: 0, ...card, position: "sticky", top: "80px" }}>
            <div style={{ marginBottom: "0.75rem" }}>
              <div style={{ fontSize: "0.65rem", color: "var(--color-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.15rem" }}>
                Day {selectedDayData.dayIndex + 1}
              </div>
              <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#fff" }}>{formatDateFull(selectedDayData.date)}</div>
            </div>
            <div style={{ display: "flex", height: "6px", borderRadius: "3px", overflow: "hidden", gap: "2px", marginBottom: "0.85rem" }}>
              {selectedDayData.songs.map((song) => (
                <div key={song.id} style={{ flex: 1, background: getColor(song.genre).dot, borderRadius: "2px" }} title={song.genre} />
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {selectedDayData.songs.map((song, idx) => {
                const c = getColor(song.genre);
                return (
                  <div key={song.id} style={{ padding: "0.5rem 0.65rem", borderRadius: "6px", background: c.bg, border: `1px solid ${c.dot}33` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.15rem" }}>
                      <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--color-muted)", width: "14px", flexShrink: 0 }}>{idx + 1}</span>
                      <span style={{ fontSize: "0.7rem", fontWeight: 700, padding: "0.1rem 0.4rem", borderRadius: "9999px", background: `${c.dot}22`, color: c.text, whiteSpace: "nowrap" }}>{song.genre}</span>
                    </div>
                    <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#fff", marginLeft: "1.1rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{song.title}</div>
                    <div style={{ fontSize: "0.68rem", color: "var(--color-muted)", marginLeft: "1.1rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{song.artist} · {song.releaseYear}</div>
                    <div style={{ fontSize: "0.65rem", color: c.text, opacity: 0.7, marginLeft: "1.1rem", marginTop: "0.1rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontStyle: "italic" }}>"{song.synonymTitle}"</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
