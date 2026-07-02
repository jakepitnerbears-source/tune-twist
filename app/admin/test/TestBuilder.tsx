"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DEFAULT_IDS = [
  "dont-stop-believin",
  "dancing-queen",
  "old-town-road",
  "thriller",
  "party-in-the-usa",
];

type SongOption = { id: string; title: string; artist: string };

export default function TestBuilder({ songs }: { songs: SongOption[] }) {
  const [selected, setSelected] = useState<string[]>(DEFAULT_IDS);
  const [error, setError] = useState("");
  const router = useRouter();

  const songMap = Object.fromEntries(songs.map((s) => [s.id, s]));

  function update(i: number, value: string) {
    const next = [...selected];
    next[i] = value;
    setSelected(next);
    setError("");
  }

  function play() {
    const valid = selected.map((id) => id.trim()).filter((id) => songMap[id]);
    if (valid.length !== 5) {
      setError(`${5 - valid.length} song(s) not recognized — check the IDs.`);
      return;
    }
    router.push(`/play/test?songs=${valid.join(",")}`);
  }

  return (
    <div className="w-full max-w-xl flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Test Day Builder</h1>
        <p className="text-sm text-[color:var(--color-muted)] mt-1">
          Pick 5 songs by ID, then play a full test session with the current hint system.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {selected.map((id, i) => {
          const match = songMap[id];
          return (
            <div key={i} className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-widest text-[color:var(--color-muted)]">
                Song {i + 1}
              </label>
              <input
                list={`song-list-${i}`}
                value={id}
                onChange={(e) => update(i, e.target.value)}
                placeholder="song-id"
                className="w-full bg-[color:var(--color-card)] border border-[color:var(--color-border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[color:var(--color-purple)] transition-colors"
              />
              <datalist id={`song-list-${i}`}>
                {songs.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} — {s.artist}
                  </option>
                ))}
              </datalist>
              {match && (
                <p className="text-xs text-[color:var(--color-muted)] pl-1">
                  ✓ {match.title} — {match.artist}
                </p>
              )}
              {id && !match && (
                <p className="text-xs text-[color:var(--color-coral)] pl-1">ID not found</p>
              )}
            </div>
          );
        })}
      </div>

      {error && <p className="text-sm text-[color:var(--color-coral)]">{error}</p>}

      <button
        onClick={play}
        className="w-full py-3 rounded-xl font-bold text-sm bg-[color:var(--color-purple)] text-white hover:opacity-90 transition-opacity"
      >
        Play Test →
      </button>
    </div>
  );
}
