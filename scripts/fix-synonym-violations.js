/**
 * fix-synonym-violations.js
 *
 * Regenerates synonymTitles for songs where the synonym contains words
 * from the real title. Uses Claude Haiku with overlap validation.
 *
 * Run with: node scripts/fix-synonym-violations.js
 */

const Anthropic = require("@anthropic-ai/sdk");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env.local") });

const SONGS_PATH = path.join(__dirname, "../data/songs.json");

const STOP = new Set([
  "a","an","the","of","in","to","and","or","but","is","are","was","were",
  "be","been","it","its","for","with","by","at","on","up","out","as","i",
  "you","me","my","your","we","our","they","their","he","she","his","her",
  "not","no","do","did","can","will","get","got","let","so","if","all",
  "too","how","what","why","when","where","just","than","then","that",
  "this","those","these","s","t","re","ve","ll","d","u",
]);

function keywords(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP.has(w));
}

function hasOverlap(title, synonymTitle) {
  const titleWords = new Set(keywords(title));
  return keywords(synonymTitle).some((w) => titleWords.has(w));
}

// Find all violations in the library
function findViolations(songs) {
  return songs
    .filter((s) => s.synonymTitle && hasOverlap(s.title, s.synonymTitle))
    .map((s) => s.id);
}

async function regenerate(client, song) {
  const prompt = `You are creating content for TitleTwist, a daily music word game where players decode synonym-transformed song titles.

Song: "${song.title}" by ${song.artist} (${song.releaseYear}) — difficulty: ${song.difficulty}

Generate a NEW synonymTitle and a new hint[0]. Rules:
- NEVER include ANY word from the real title "${song.title}" — not nouns, not numbers, not names, not small words that appear in the title.
- NEVER include the artist name.
- Difficulty ${song.difficulty}: ${
    song.difficulty === "easy"
      ? "1-2 obvious swaps"
      : song.difficulty === "medium"
      ? "2-3 swaps, slightly less obvious"
      : song.difficulty === "hard"
      ? "3+ swaps, more abstract"
      : "clever/playful swap"
  }
- hints[0] must also contain NO words from the real title (it is a different synonym version).
- hints[1] stays: "${song.hints[1]}"
- hints[2] stays: "${song.hints[2]}"

Respond with ONLY valid JSON:
{
  "synonymTitle": "...",
  "hints": ["<different synonym version, no original title words>", "${song.hints[1]}", "${song.hints[2]}"]
}`;

  for (let attempt = 0; attempt < 5; attempt++) {
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    });
    const text = msg.content[0].text.trim();
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) continue;
    try {
      const parsed = JSON.parse(match[0]);
      if (!parsed.synonymTitle) continue;
      if (hasOverlap(song.title, parsed.synonymTitle)) {
        console.log(`    attempt ${attempt + 1} synonymTitle still has overlap: "${parsed.synonymTitle}"`);
        continue;
      }
      if (parsed.hints && parsed.hints[0] && hasOverlap(song.title, parsed.hints[0])) {
        console.log(`    attempt ${attempt + 1} hint[0] still has overlap: "${parsed.hints[0]}"`);
        continue;
      }
      return parsed;
    } catch {}
  }
  return null;
}

async function main() {
  console.log("\n🎵 TitleTwist — Fix Synonym Violations\n");

  const songs = JSON.parse(fs.readFileSync(SONGS_PATH, "utf-8"));
  const violations = findViolations(songs);

  console.log(`Found ${violations.length} synonym violations.\n`);

  if (violations.length === 0) {
    console.log("✅ No violations found. Nothing to do.");
    return;
  }

  const client = new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY });
  let fixed = 0;

  for (const id of violations) {
    const idx = songs.findIndex((s) => s.id === id);
    const song = songs[idx];
    process.stdout.write(`  "${song.title}" (was: "${song.synonymTitle}") ... `);

    const result = await regenerate(client, song);
    if (result) {
      songs[idx].synonymTitle = result.synonymTitle;
      songs[idx].hints[0] = result.hints[0];
      console.log(`✓ -> "${result.synonymTitle}"`);
      fixed++;
    } else {
      console.log(`✗ FAILED after 5 attempts`);
    }

    await new Promise((r) => setTimeout(r, 200));
  }

  fs.writeFileSync(SONGS_PATH, JSON.stringify(songs, null, 2));

  console.log(`\n✅ Fixed ${fixed}/${violations.length} violations.`);
  console.log(`💾 Saved to data/songs.json\n`);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
