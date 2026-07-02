/**
 * generate-lyrics.ts
 *
 * Generates short lyric snippet hints for songs in genre-list files.
 * Snippets are in the style of: "Small town girl. Midnight train."
 *
 * Usage:
 *   npx ts-node --skip-project scripts/generate-lyrics.ts --genre pop
 *   npx ts-node --skip-project scripts/generate-lyrics.ts --genre all
 *   npx ts-node --skip-project scripts/generate-lyrics.ts --genre pop --limit 50
 */

import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const LYRICS_PATH = path.join(process.cwd(), "data/lyrics.json");
const GENRE_DIR = path.join(process.cwd(), "data/genre-lists");

const GENRE_FILES: Record<string, string> = {
  pop: "pop.txt",
  rock: "rock.txt",
  "r-b": "r-b.txt",
  "hip-hop": "hip-hop.txt",
  country: "country.txt",
  electronic: "electronic.txt",
  "pop-punk": "pop-punk.txt",
  indie: "indie.txt",
  funk: "funk.txt",
  folk: "folk.txt",
  jazz: "jazz.txt",
  metal: "metal.txt",
};

function loadGenreFile(genre: string): { id: string; title: string; artist: string }[] {
  const file = GENRE_FILES[genre];
  if (!file) return [];
  const filePath = path.join(GENRE_DIR, file);
  if (!fs.existsSync(filePath)) return [];
  return fs
    .readFileSync(filePath, "utf-8")
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [id, title, artist] = line.split(" | ").map((s) => s.trim());
      return { id, title, artist };
    });
}

async function generateSnippet(
  client: Anthropic,
  title: string,
  artist: string
): Promise<string | null> {
  const prompt = `You are writing hint clues for a music guessing game. The goal is to give players a memorable, recognizable lyric fragment from the song — without naming the song or artist.

Song: "${title}" by ${artist}

Write a short lyric snippet hint (10–20 words max) that:
- Captures a truly iconic, recognizable moment from the song
- Uses fragments of the actual lyrics, paraphrased if needed to stay clean and family-friendly
- Is written as short punchy phrases, separated by periods (e.g. "Small town girl. Midnight train." or "Young, sweet, and seventeen.")
- Does NOT include the song title or artist name
- Stays upbeat and positive in tone — avoid quoting any violent, explicit, or adult-only content even if the song contains it; choose a different memorable line instead

Respond with ONLY the snippet. No quotes, no explanation.`;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 60,
      messages: [{ role: "user", content: prompt }],
    });

    const text = (message.content[0] as { text: string }).text.trim();
    return text || null;
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    if (e?.status === 400) {
      console.log("  (content filter — skipped)");
    } else {
      console.log(`  (error: ${e?.message})`);
    }
    return null;
  }
}

async function main() {
  const args = process.argv;
  const genreIdx = args.indexOf("--genre");
  const genreArg = genreIdx !== -1 ? args[genreIdx + 1] : "pop";
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : Infinity;

  const genres = genreArg === "all" ? Object.keys(GENRE_FILES) : [genreArg];

  // Load existing lyrics
  let lyrics: Record<string, string> = {};
  if (fs.existsSync(LYRICS_PATH)) {
    lyrics = JSON.parse(fs.readFileSync(LYRICS_PATH, "utf-8"));
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  for (const genre of genres) {
    const songs = loadGenreFile(genre);
    if (!songs.length) {
      console.log(`No songs found for genre: ${genre}`);
      continue;
    }

    const todo = songs.filter((s) => !lyrics[s.id]);
    const batch = todo.slice(0, limit);

    console.log(`\n🎵 Genre: ${genre} — ${batch.length} songs to process (${todo.length - batch.length} remaining after this run)\n`);

    let done = 0;
    let skipped = 0;

    for (const song of batch) {
      process.stdout.write(`  [${done + skipped + 1}/${batch.length}] "${song.title}" — ${song.artist} ... `);
      const snippet = await generateSnippet(client, song.title, song.artist);
      if (snippet) {
        lyrics[song.id] = snippet;
        console.log(`✓  "${snippet}"`);
        done++;
      } else {
        skipped++;
      }

      // Save after every song so progress isn't lost on crash
      fs.writeFileSync(LYRICS_PATH, JSON.stringify(lyrics, null, 2));

      await new Promise((r) => setTimeout(r, 150));
    }

    console.log(`\n  ✅ ${done} generated, ${skipped} skipped\n`);

    // Write plain text review file for this genre
    const allSongs = loadGenreFile(genre);
    const txtLines = allSongs
      .map((s, i) => `${i + 1}. ${s.id} | ${s.title} | ${s.artist}\n   ${lyrics[s.id] ?? "(no snippet yet)"}`)
      .join("\n\n");
    const txtPath = path.join(process.cwd(), `data/lyrics-${genre}.txt`);
    fs.writeFileSync(txtPath, txtLines + "\n");
    console.log(`📄 Review file: data/lyrics-${genre}.txt`);
  }

  console.log(`\n💾 lyrics.json updated — ${Object.keys(lyrics).length} total entries`);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
