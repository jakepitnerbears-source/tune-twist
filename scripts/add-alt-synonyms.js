#!/usr/bin/env node
// Generates alternate synonyms for all songs missing hints[3],
// then restructures ALL songs to new hint order: [alt_synonym, genre_no_year, artist]

const Anthropic = require("@anthropic-ai/sdk");
const fs = require("fs");
const path = require("path");

const client = new Anthropic();

function stripYear(genre) {
  return genre
    .replace(/^(late|early|mid[-\s]?)?\s*\d{4}s?\s+/i, "")
    .replace(/^(late|early|mid[-\s]?)?\s*\d{2}s?\s+/i, "")
    .trim();
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

async function generateAlts(batch, attempt = 1) {
  const prompt = `For each song below, write a short alternate synonym title — a creative rephrasing of the real song name using different synonyms than the existing one.

Rules:
- Do NOT use any words from the original title
- Do NOT use the artist name
- Use different words from the existing synonym title where possible
- Keep it short (2-5 words typically)
- Parenthetical info like (feat. X) can be dropped
- Use only standard ASCII characters (no apostrophes, curly quotes, or special symbols)

Return ONLY valid JSON, no markdown, no explanation:
{ "id1": "Alternate Title Here", "id2": "Another Title Here" }

Songs:
${batch.map((s) => `"${s.id}": real="${s.title}", existing_synonym="${s.synonymTitle}"`).join("\n")}`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].text;
  // Clean up common JSON issues
  const cleaned = text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON in response: " + text.slice(0, 200));
  try {
    return JSON.parse(match[0]);
  } catch (e) {
    if (attempt < 3) {
      console.log(`  JSON parse failed, retrying (attempt ${attempt + 1})...`);
      return generateAlts(batch, attempt + 1);
    }
    throw e;
  }
}

async function main() {
  const songsPath = path.join(__dirname, "../data/songs.json");
  const songs = JSON.parse(fs.readFileSync(songsPath, "utf-8"));

  const altMap = {};
  const batchSize = 15;
  const progressPath = path.join(__dirname, "../data/.alt-synonyms-progress.json");
  // Restore any saved progress
  if (fs.existsSync(progressPath)) {
    const saved = JSON.parse(fs.readFileSync(progressPath, "utf-8"));
    Object.assign(altMap, saved);
    console.log(`Restored ${Object.keys(saved).length} from previous run`);
  }

  const missing = songs.filter((s) => s.hints.length < 4 && !altMap[s.id]);
  console.log(`Generating alternates for ${missing.length} songs...`);

  for (let i = 0; i < missing.length; i += batchSize) {
    const batch = missing.slice(i, i + batchSize);
    console.log(
      `Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(missing.length / batchSize)} (${batch.length} songs)...`
    );
    const result = await generateAlts(batch);
    Object.assign(altMap, result);
    fs.writeFileSync(progressPath, JSON.stringify(altMap, null, 2));
  }

  console.log(`Generated ${Object.keys(altMap).length} alternates`);

  // Restructure ALL songs: [alt_synonym, genre_no_year, artist]
  const updated = songs.map((song) => {
    const genre = capitalize(stripYear(song.hints[0]));
    const artist = song.hints[2]; // "Artist: X" — always was at index 2
    let alt;
    if (song.hints.length === 4) {
      alt = song.hints[3];
    } else {
      alt = altMap[song.id];
      if (!alt) {
        console.warn(`No alt generated for ${song.id}, using synonymTitle`);
        alt = song.synonymTitle;
      }
    }
    return { ...song, hints: [alt, genre, artist] };
  });

  fs.writeFileSync(songsPath, JSON.stringify(updated, null, 2));
  console.log("Done! songs.json updated.");

  // Spot check
  console.log("\nSample results:");
  ["s-m", "work-out", "shape-of-you", "blinding-lights"].forEach((id) => {
    const s = updated.find((x) => x.id === id);
    if (s) console.log(`  ${s.title}: ${JSON.stringify(s.hints)}`);
  });
}

main().catch(console.error);
