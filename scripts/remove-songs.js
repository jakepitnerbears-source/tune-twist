/**
 * remove-songs.js
 * Removes a list of songs from songs.json and patches all affected schedule slots.
 */

const fs = require("fs");
const path = require("path");

const SONGS_PATH    = path.join(__dirname, "../data/songs.json");
const SCHEDULE_PATH = path.join(__dirname, "../data/schedule.json");
const READABLE_PATH = path.join(__dirname, "../data/schedule-readable.txt");

const SLOT_DIFFICULTY = ["easy", "medium", "medium", "hard", "viral"];
const WINDOW = 60;

const REMOVE_TITLES = [
  "Headlines","Love Me","She Will","Sorry Not Sorry","Give Me Everything",
  "Too Many Nights","Wish","LOVE.","Mood","Nothin' on You","Sundress",
  "Sweet Life","The Way I Are","Trance","Trap Queen","WAIT FOR U",
  "Yeah 3x","No Pole","Unforgettable","Yeah!",
];

const norm = (t) => t.toLowerCase().replace(/[^a-z0-9]/g, "");
const removeSet = new Set(REMOVE_TITLES.map(norm));

// ── Load data ──────────────────────────────────────────────────────────────────
const songs    = JSON.parse(fs.readFileSync(SONGS_PATH, "utf-8"));
const schedule = JSON.parse(fs.readFileSync(SCHEDULE_PATH, "utf-8"));

const removeIds = new Set(songs.filter((s) => removeSet.has(norm(s.title))).map((s) => s.id));
console.log(`\nRemoving ${removeIds.size} songs:`, [...removeIds]);

// ── Remove from library ────────────────────────────────────────────────────────
const library = songs.filter((s) => !removeIds.has(s.id));
const songMap  = Object.fromEntries(library.map((s) => [s.id, s]));

// ── Patch schedule ─────────────────────────────────────────────────────────────
const dates = Object.keys(schedule).sort();

function nearestOccurrence(id, targetDate, excludeDate) {
  let min = Infinity;
  for (const [d, slots] of Object.entries(schedule)) {
    if (d === excludeDate) continue;
    if (slots.includes(id)) {
      const diff = Math.abs(new Date(d) - new Date(targetDate)) / 86400000;
      if (diff < min) min = diff;
    }
  }
  return min;
}

function findReplacement(targetDate, slotIndex, currentSlots) {
  const diff = SLOT_DIFFICULTY[slotIndex];
  const pool = library.filter((s) => s.difficulty === diff);
  const targetMs = new Date(targetDate).getTime();

  // Artists already in this day's lineup (excluding the slot being replaced)
  const dayArtists = new Set(
    currentSlots
      .filter((_, i) => i !== slotIndex)
      .map((id) => songMap[id]?.artist)
      .filter(Boolean)
  );

  const candidates = pool.filter((s) => {
    if (dayArtists.has(s.artist)) return false;
    const nearest = nearestOccurrence(s.id, targetDate, targetDate);
    return nearest >= WINDOW;
  });

  if (candidates.length === 0) {
    // Relax: pick song with largest gap
    const fallback = pool
      .filter((s) => !dayArtists.has(s.artist))
      .map((s) => ({ s, gap: nearestOccurrence(s.id, targetDate, targetDate) }))
      .sort((a, b) => b.gap - a.gap)[0];
    return fallback?.s ?? null;
  }

  // Prefer songs not yet in schedule at all, then pick alphabetically for determinism
  const unscheduled = candidates.filter((s) => nearestOccurrence(s.id, targetDate, targetDate) === Infinity);
  const chosen = unscheduled.length ? unscheduled[0] : candidates[0];
  return chosen;
}

let patched = 0;
for (const date of dates) {
  const slots = [...schedule[date]];
  let changed = false;
  for (let i = 0; i < slots.length; i++) {
    if (removeIds.has(slots[i])) {
      const replacement = findReplacement(date, i, slots);
      if (!replacement) {
        console.warn(`  ⚠️  No replacement found for ${date} slot ${i}`);
        continue;
      }
      console.log(`  ${date} slot ${i}: ${slots[i]} → ${replacement.id}`);
      slots[i] = replacement.id;
      changed = true;
      patched++;
    }
  }
  if (changed) schedule[date] = slots;
}

// ── Save ───────────────────────────────────────────────────────────────────────
fs.writeFileSync(SONGS_PATH, JSON.stringify(library, null, 2));
fs.writeFileSync(SCHEDULE_PATH, JSON.stringify(schedule, null, 2));

// Regenerate readable
const lines = Object.keys(schedule).sort().map((date) => {
  const slots = schedule[date];
  const labels = ["Easy","Med1","Med2","Hard","Viral"];
  const parts = slots.map((id, i) => {
    const s = songMap[id] || library.find((x) => x.id === id);
    return `  ${labels[i]}: ${s ? `${s.title} — ${s.artist}` : id}`;
  });
  return `${date}\n${parts.join("\n")}`;
});
fs.writeFileSync(READABLE_PATH, lines.join("\n\n"));

console.log(`\n✅ Done!`);
console.log(`   Removed: ${removeIds.size} songs`);
console.log(`   Patched: ${patched} schedule slots`);
console.log(`   Library: ${library.length} songs`);
