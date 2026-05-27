const fs = require("fs");
const path = require("path");

const songsPath = path.join(__dirname, "../data/songs.json");
const outPath = path.join(__dirname, "../data/schedule.json");

const songs = JSON.parse(fs.readFileSync(songsPath, "utf-8"));
const CYCLE = 90;
const PER_DAY = 5;

// Fisher-Yates shuffle
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Build initial groups: shuffle all songs, fill 89 unique days, day 89 reuses from day 0
function buildGroups(shuffled) {
  const groups = [];
  for (let i = 0; i < 89; i++) {
    groups.push(shuffled.slice(i * PER_DAY, i * PER_DAY + PER_DAY).map((s) => s.id));
  }
  // Day 89: remaining 2 songs + 3 from day 0
  const remaining = shuffled.slice(89 * PER_DAY).map((s) => s.id);
  const filler = groups[0].slice(0, PER_DAY - remaining.length);
  groups.push([...remaining, ...filler]);
  return groups;
}

// Count genre occurrences in a day's song ids
function genreCounts(ids, songMap) {
  const counts = {};
  for (const id of ids) {
    const g = songMap[id]?.genre ?? "Unknown";
    counts[g] = (counts[g] ?? 0) + 1;
  }
  return counts;
}

// Try to balance genres: no day should have 3+ of the same genre.
// Simple greedy swap: if a day has 3+ of genre G, try swapping one song with
// a song from another day that has a surplus of a different genre.
function balanceGenres(groups, songMap) {
  const MAX_SAME_GENRE = 2;
  let improved = true;
  let passes = 0;

  while (improved && passes < 200) {
    improved = false;
    passes++;

    for (let di = 0; di < groups.length; di++) {
      const counts = genreCounts(groups[di], songMap);
      const overGenre = Object.entries(counts).find(([, c]) => c > MAX_SAME_GENRE);
      if (!overGenre) continue;

      const [badGenre] = overGenre;
      // Find an index in this day with badGenre
      const swapOutIdx = groups[di].findIndex(
        (id) => (songMap[id]?.genre ?? "Unknown") === badGenre
      );

      // Find another day that has a surplus of a different genre and can spare it
      let swapped = false;
      for (let dj = 0; dj < groups.length && !swapped; dj++) {
        if (dj === di) continue;
        const otherCounts = genreCounts(groups[dj], songMap);
        for (let k = 0; k < groups[dj].length && !swapped; k++) {
          const candId = groups[dj][k];
          const candGenre = songMap[candId]?.genre ?? "Unknown";
          if (candGenre === badGenre) continue; // same problem genre, no help

          // Would this swap help di without hurting dj?
          const diAfterCounts = { ...counts };
          diAfterCounts[badGenre]--;
          diAfterCounts[candGenre] = (diAfterCounts[candGenre] ?? 0) + 1;
          const djAfterCounts = { ...otherCounts };
          djAfterCounts[candGenre] = (djAfterCounts[candGenre] ?? 0) - 1;
          djAfterCounts[badGenre] = (djAfterCounts[badGenre] ?? 0) + 1;

          const diMaxAfter = Math.max(...Object.values(diAfterCounts));
          const djMaxAfter = Math.max(...Object.values(djAfterCounts));

          if (diMaxAfter <= MAX_SAME_GENRE && djMaxAfter <= MAX_SAME_GENRE) {
            // Do the swap
            [groups[di][swapOutIdx], groups[dj][k]] = [groups[dj][k], groups[di][swapOutIdx]];
            improved = true;
            swapped = true;
          }
        }
      }
    }
  }

  return groups;
}

function validate(groups, songMap) {
  const allIds = groups.flat();
  const counts = {};
  for (const id of allIds) counts[id] = (counts[id] ?? 0) + 1;
  const dupes = Object.entries(counts).filter(([, c]) => c > 1);
  const genreViolations = groups.filter((g) => {
    const gc = genreCounts(g, songMap);
    return Object.values(gc).some((c) => c > 2);
  });
  console.log(`Total song slots: ${allIds.length}`);
  console.log(`Unique songs used: ${Object.keys(counts).length}`);
  console.log(`Songs appearing twice: ${dupes.length} (${dupes.map(([id]) => id).join(", ")})`);
  console.log(`Days with 3+ same genre: ${genreViolations.length}`);
}

// Main
const songMap = Object.fromEntries(songs.map((s) => [s.id, s]));
const shuffled = shuffle(songs).slice(0, CYCLE * PER_DAY); // cap at exactly 450 slots
let groups = buildGroups(shuffled);
groups = balanceGenres(groups, songMap);
validate(groups, songMap);

fs.writeFileSync(outPath, JSON.stringify(groups, null, 2));
console.log(`\nWrote ${groups.length} days to ${outPath}`);
