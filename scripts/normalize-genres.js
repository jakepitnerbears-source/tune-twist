/**
 * normalize-genres.js
 * Remaps all genre strings in songs.json to a clean, consistent set.
 */

const fs = require("fs");
const path = require("path");

const SONGS_PATH = path.join(__dirname, "../data/songs.json");

function normalize(genre) {
  if (!genre) return "Pop";
  const g = genre.toLowerCase();

  // Metal — check before rock
  if (g.includes("metal") || g.includes("industrial")) return "Metal";

  // Pop-Punk — check before punk/rock/pop
  if (g.includes("pop-punk") || g.includes("pop punk") || g.includes("emo")) return "Pop-Punk";

  // Latin — check before pop/hip-hop
  if (g.includes("latin") || g.includes("reggaeton") || g.includes("reggae")) return "Latin";

  // Hip-Hop
  if (
    g.includes("hip-hop") || g.includes("hip hop") ||
    g.includes("rap") || g.includes("trap") || g.includes("crunk")
  ) return "Hip-Hop";

  // R&B
  if (
    g.includes("r&b") || g.includes("soul") || g.includes("neo-soul") ||
    g.includes("dancehall") || g.includes("afrobeat")
  ) return "R&B";

  // Electronic — check before pop
  if (
    g.includes("electronic") || g.includes("edm") || g.includes("synth") ||
    g.includes("new wave") || g.includes("dance-pop") || g.includes("dance/pop") ||
    g.includes("house") || g.includes("synthwave")
  ) return "Electronic";

  // Funk/Disco
  if (g.includes("funk") || g.includes("disco")) return "Funk/Disco";

  // Country
  if (g.includes("country") || g.includes("folk")) return "Country";

  // Alternative — check before Rock and Indie
  if (
    g.includes("alternative") || g.includes("alt rock") || g.includes("grunge") ||
    g.includes("post-punk") || g.includes("britpop") || g.includes("brit-pop") ||
    g.includes("psychedelic rock") || g.includes("garage rock")
  ) return "Alternative";

  // Indie — check before Rock
  if (
    g.includes("indie") || g.includes("dream pop") || g.includes("art pop") ||
    g.includes("lo-fi") || g.includes("psychedelic pop")
  ) return "Indie";

  // Rock
  if (g.includes("rock")) return "Rock";

  // K-pop → Pop
  if (g.includes("k-pop") || g.includes("kpop")) return "Pop";

  // Pop fallback
  return "Pop";
}

const songs = JSON.parse(fs.readFileSync(SONGS_PATH, "utf-8"));

const before = {};
const after = {};

const updated = songs.map((s) => {
  const old = s.genre || "(none)";
  const fresh = normalize(s.genre);
  before[old] = (before[old] || 0) + 1;
  after[fresh] = (after[fresh] || 0) + 1;
  return { ...s, genre: fresh };
});

fs.writeFileSync(SONGS_PATH, JSON.stringify(updated, null, 2));

console.log("\nGenre distribution after normalization:");
Object.entries(after).sort((a, b) => b[1] - a[1]).forEach(([g, n]) => {
  console.log(`  ${String(n).padStart(3)}  ${g}`);
});
console.log(`\nTotal: ${updated.length} songs`);
