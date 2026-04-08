/**
 * add-specific-songs.js
 *
 * Adds a curated list of specific songs to songs.json via Claude Haiku.
 * Skips any song already in the library (by title match).
 *
 * Run with: node scripts/add-specific-songs.js
 */

const Anthropic = require("@anthropic-ai/sdk");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env.local") });

const SONGS_PATH = path.join(__dirname, "../data/songs.json");

// ── Song list ──────────────────────────────────────────────────────────────────
// Format: [title, artist, year, difficulty]
const SONGS_TO_ADD = [
  // Easy
  ["Cruel Summer", "Taylor Swift", "2019", "medium"],
  ["Style", "Taylor Swift", "2014", "easy"],
  ["Just the Way You Are", "Bruno Mars", "2010", "easy"],
  ["Attention", "Charlie Puth", "2017", "easy"],
  ["Intentions", "Justin Bieber", "2020", "easy"],
  ["We Are Young", "fun.", "2011", "easy"],
  ["Some Nights", "fun.", "2012", "easy"],
  ["Replay", "Iyaz", "2009", "easy"],
  ["No One", "Alicia Keys", "2007", "easy"],
  ["Run It", "Chris Brown", "2005", "easy"],
  ["Let Me Love You", "Mario", "2004", "easy"],
  ["Beautiful Girls", "Sean Kingston", "2007", "easy"],
  ["Airplanes", "B.o.B & Hayley Williams", "2010", "easy"],
  ["Faith", "George Michael", "1987", "easy"],
  ["Respect", "Aretha Franklin", "1967", "easy"],
  ["Stand By Me", "Ben E. King", "1961", "easy"],
  ["Piano Man", "Billy Joel", "1973", "easy"],
  ["Shout", "Tears for Fears", "1984", "easy"],
  ["Black or White", "Michael Jackson", "1991", "easy"],
  ["Let It Be", "The Beatles", "1970", "easy"],
  ["Come Together", "The Beatles", "1969", "easy"],
  ["Twist and Shout", "The Beatles", "1963", "easy"],
  ["Paradise", "Coldplay", "2011", "easy"],

  // Medium
  ["Bad Romance", "Lady Gaga", "2009", "medium"],
  ["Grenade", "Bruno Mars", "2010", "medium"],
  ["See You Again", "Wiz Khalifa & Charlie Puth", "2015", "medium"],
  ["What Do You Mean", "Justin Bieber", "2015", "medium"],
  ["Cool for the Summer", "Demi Lovato", "2015", "medium"],
  ["Glad You Came", "The Wanted", "2011", "medium"],
  ["How You Remind Me", "Nickelback", "2001", "medium"],
  ["Kryptonite", "3 Doors Down", "2000", "medium"],
  ["Ocean Avenue", "Yellowcard", "2003", "medium"],
  ["Sugar, We're Goin Down", "Fall Out Boy", "2005", "medium"],
  ["Misery Business", "Paramore", "2007", "medium"],
  ["If I Ain't Got You", "Alicia Keys", "2003", "medium"],
  ["Yeah 3x", "Chris Brown", "2011", "medium"],
  ["Fireflies", "Owl City", "2009", "medium"],
  ["Hey There Delilah", "Plain White T's", "2007", "medium"],
  ["Lips of an Angel", "Hinder", "2005", "medium"],
  ["Break Your Heart", "Taio Cruz", "2009", "medium"],
  ["Billionaire", "Travie McCoy & Bruno Mars", "2010", "medium"],
  ["Nothin' on You", "B.o.B & Bruno Mars", "2010", "medium"],
  ["Footloose", "Kenny Loggins", "1984", "medium"],
  ["Take My Breath Away", "Berlin", "1986", "medium"],
  ["You Give Love a Bad Name", "Bon Jovi", "1986", "medium"],
  ["Every Breath You Take", "The Police", "1983", "medium"],
  ["Wake Me Up Before You Go-Go", "Wham!", "1984", "medium"],
  ["Careless Whisper", "George Michael", "1984", "medium"],
  ["I Wanna Dance with Somebody", "Whitney Houston", "1987", "medium"],
  ["How Will I Know", "Whitney Houston", "1985", "medium"],
  ["I'm Every Woman", "Whitney Houston", "1992", "medium"],
  ["Ain't No Mountain High Enough", "Marvin Gaye & Tammi Terrell", "1967", "medium"],
  ["Tiny Dancer", "Elton John", "1971", "medium"],
  ["Rocket Man", "Elton John", "1972", "medium"],
  ["The Joker", "Steve Miller Band", "1973", "medium"],
  ["Fly Like an Eagle", "Steve Miller Band", "1976", "medium"],
  ["Free Fallin'", "Tom Petty", "1989", "medium"],
  ["Everybody Wants to Rule the World", "Tears for Fears", "1985", "medium"],
  ["Sweet Dreams (Are Made of This)", "Eurythmics", "1983", "medium"],
  ["Smooth Criminal", "Michael Jackson", "1987", "medium"],
  ["Here Comes the Sun", "The Beatles", "1969", "medium"],
  ["Brown Eyed Girl", "Van Morrison", "1967", "medium"],
  ["September", "Earth, Wind & Fire", "1978", "medium"],
  ["Boogie Wonderland", "Earth, Wind & Fire", "1979", "medium"],
  ["Let's Groove", "Earth, Wind & Fire", "1981", "medium"],
  ["A Sky Full of Stars", "Coldplay", "2014", "medium"],
  ["Adventure of a Lifetime", "Coldplay", "2015", "medium"],

  // Hard
  ["Mr. Jones", "Counting Crows", "1993", "hard"],
  ["Thnks fr th Mmrs", "Fall Out Boy", "2007", "hard"],
  ["Decode", "Paramore", "2008", "hard"],
  ["Summer of '69", "Bryan Adams", "1985", "hard"],
  ["Vienna", "Billy Joel", "1977", "hard"],
  ["Dirty Diana", "Michael Jackson", "1988", "hard"],
  ["Edge of Seventeen", "Stevie Nicks", "1981", "hard"],
  ["American Pie", "Don McLean", "1971", "hard"],

  // Viral
  ["Boom Boom Pow", "Black Eyed Peas", "2009", "viral"],
  ["Party Rock Anthem", "LMFAO", "2011", "viral"],
  ["Shots", "LMFAO & Lil Jon", "2009", "viral"],
  ["Turn Down for What", "DJ Snake & Lil Jon", "2013", "viral"],
  ["We Will Rock You", "Queen", "1977", "viral"],
  ["Another One Bites the Dust", "Queen", "1980", "viral"],
];

// ── Helpers ────────────────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  "a","an","the","of","in","to","and","or","but","is","are","was","were",
  "be","been","it","its","for","with","by","at","on","up","out","as","i",
  "you","me","my","your","we","our","they","their","he","she","his","her",
  "not","no","do","did","can","will","get","got","let","so","if","all",
  "too","how","what","why","when","where","just","than","then","that",
  "this","those","these","s","t","re","ve","ll","d","u",
]);

function titleKeywords(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

function synonymOverlapsTitle(title, synonymTitle) {
  const titleWords = new Set(titleKeywords(title));
  return titleKeywords(synonymTitle).some((w) => titleWords.has(w));
}

function toSlug(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

async function generateEntry(client, title, artist, year, difficulty) {
  const prompt = `You are creating content for TuneTwist, a daily music word game where players decode synonym-transformed song titles.

Song: "${title}" by ${artist} (${year}) — difficulty: ${difficulty}

Generate a JSON object. Rules:
- synonymTitle: Replace key words with synonyms. Difficulty level is ${difficulty}.
  - NEVER include any word from the real song title in synonymTitle. Not a single word — not nouns, numbers, names, or small words that appear in the title.
  - NEVER include the artist name in synonymTitle.
  - Easy: 1-2 obvious synonym swaps
  - Medium: 2-3 swaps, slightly less obvious
  - Hard: 3+ swaps, more abstract
  - Viral: clever/playful swap for a well-known throwback
- genre: short genre label (e.g. "Pop/R&B", "Hip-hop", "Indie rock", "EDM/pop") — NO decade prefix
- hints: exactly 3 strings in this order:
  1. A completely different synonym version of the title (different word choices from synonymTitle, also NO words from the real title)
  2. "Released in ${year}"
  3. Artist clue: "Artist: ${artist}"
- id: lowercase hyphenated version of the title

Respond with ONLY valid JSON, no explanation:
{
  "id": "...",
  "title": "${title}",
  "artist": "${artist}",
  "releaseYear": "${year}",
  "synonymTitle": "...",
  "difficulty": "${difficulty}",
  "genre": "...",
  "hints": ["...", "Released in ${year}", "Artist: ${artist}"]
}`;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const message = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      });

      const text = message.content[0].text.trim();
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) continue;

      const song = JSON.parse(match[0]);
      if (!song.id || !song.synonymTitle || !Array.isArray(song.hints) || song.hints.length !== 3) continue;
      if (song.synonymTitle.toLowerCase() === title.toLowerCase()) continue;

      // Reject if synonymTitle or hint[0] contains words from the real title
      if (synonymOverlapsTitle(title, song.synonymTitle)) continue;
      if (synonymOverlapsTitle(title, song.hints[0])) continue;

      // Always use the caller-specified difficulty
      song.difficulty = difficulty;

      return song;
    } catch {
      continue;
    }
  }
  return null;
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🎵 TuneTwist — Add Specific Songs");

  const existing = JSON.parse(fs.readFileSync(SONGS_PATH, "utf-8"));
  const existingIds = new Set(existing.map((s) => s.id));
  const norm = (t) => t.toLowerCase().replace(/[^a-z0-9]/g, "");
  const existingNorm = new Set(existing.map((s) => norm(s.title)));

  console.log(`📚 Existing library: ${existing.length} songs`);

  const isNumericOnly = (title) => /^\d+$/.test(title.trim());
  const toProcess = SONGS_TO_ADD.filter(([title]) => {
    if (isNumericOnly(title)) {
      console.log(`⛔ Skipping numeric-only title: "${title}"`);
      return false;
    }
    return !existingNorm.has(norm(title));
  });
  const skipped = SONGS_TO_ADD.length - toProcess.length;

  console.log(`⏭  Skipping ${skipped} already-present songs`);
  console.log(`🎯 Processing ${toProcess.length} new songs\n`);

  const client = new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY });
  const newSongs = [];

  for (let i = 0; i < toProcess.length; i++) {
    const [title, artist, year, difficulty] = toProcess[i];
    process.stdout.write(`  [${i + 1}/${toProcess.length}] "${title}" — ${artist} ... `);

    const song = await generateEntry(client, title, artist, year, difficulty);

    if (song) {
      // Ensure unique ID
      let id = toSlug(title);
      let suffix = 1;
      while (existingIds.has(id)) id = `${toSlug(title)}-${suffix++}`;
      song.id = id;
      existingIds.add(id);
      newSongs.push(song);
      console.log(`✓`);
    } else {
      console.log(`✗ skipped`);
    }

    await new Promise((r) => setTimeout(r, 150));
  }

  const updated = [...existing, ...newSongs];
  fs.writeFileSync(SONGS_PATH, JSON.stringify(updated, null, 2));

  const byDiff = { easy: 0, medium: 0, hard: 0, viral: 0 };
  for (const s of newSongs) byDiff[s.difficulty]++;

  console.log(`\n✅ Done! Added ${newSongs.length} songs.`);
  console.log(`📦 Total library: ${updated.length} songs`);
  console.log(`   Easy: ${byDiff.easy} | Medium: ${byDiff.medium} | Hard: ${byDiff.hard} | Viral: ${byDiff.viral}`);
  console.log(`💾 Saved to data/songs.json\n`);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
