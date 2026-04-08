/**
 * fix-schedule.js
 *
 * Scans schedule.json for duplicate songs (within a 180-day window)
 * and replaces them with unused songs of the same difficulty.
 *
 * Run with: node scripts/fix-schedule.js
 */

const fs = require("fs");
const path = require("path");

const SCHEDULE_PATH = path.join(__dirname, "../data/schedule.json");
const SONGS_PATH = path.join(__dirname, "../data/songs.json");
const NO_REPEAT_DAYS = 60;

const schedule = JSON.parse(fs.readFileSync(SCHEDULE_PATH, "utf-8"));
const library = JSON.parse(fs.readFileSync(SONGS_PATH, "utf-8"));

const songMap = Object.fromEntries(library.map((s) => [s.id, s]));
const sortedDates = Object.keys(schedule).sort();

// Track usage: songId -> array of dates it was used
const usageHistory = {};

let replacements = 0;
let failures = 0;

for (const date of sortedDates) {
  const ids = schedule[date];
  const newIds = [];

  for (const id of ids) {
    const song = songMap[id];
    if (!song) {
      console.warn(`  [MISSING] ${id} on ${date} — song not found in library`);
      newIds.push(id);
      continue;
    }

    const lastUsed = usageHistory[id];
    const daysSinceLast = lastUsed
      ? Math.floor((new Date(date) - new Date(lastUsed)) / (1000 * 60 * 60 * 24))
      : Infinity;

    if (daysSinceLast >= NO_REPEAT_DAYS) {
      // Fine — use it
      newIds.push(id);
      usageHistory[id] = date;
    } else {
      // Duplicate — find a replacement of the same difficulty
      const usedOnThisDay = new Set([...newIds]);
      const recentlyUsed = new Set(
        Object.entries(usageHistory)
          .filter(([, d]) => {
            const days = Math.floor((new Date(date) - new Date(d)) / (1000 * 60 * 60 * 24));
            return days < NO_REPEAT_DAYS;
          })
          .map(([sid]) => sid)
      );

      const replacement = library.find(
        (s) =>
          s.difficulty === song.difficulty &&
          !recentlyUsed.has(s.id) &&
          !usedOnThisDay.has(s.id)
      );

      if (replacement) {
        console.log(`  [REPLACED] ${date}: ${id} → ${replacement.id}`);
        newIds.push(replacement.id);
        usageHistory[replacement.id] = date;
        replacements++;
      } else {
        console.warn(`  [FAILED]   ${date}: ${id} — no available replacement for difficulty "${song.difficulty}"`);
        newIds.push(id); // Keep the duplicate, flag it
        usageHistory[id] = date;
        failures++;
      }
    }
  }

  schedule[date] = newIds;
}

fs.writeFileSync(SCHEDULE_PATH, JSON.stringify(schedule, null, 2));

console.log("\n--- Done ---");
console.log(`Replacements made: ${replacements}`);
if (failures > 0) {
  console.log(`Could not replace: ${failures} (library too small for that difficulty)`);
}
console.log("schedule.json has been updated.");
