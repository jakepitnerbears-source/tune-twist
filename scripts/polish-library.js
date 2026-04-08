#!/usr/bin/env node
/**
 * polish-library.js
 *
 * Final polish pass:
 * 1. Normalize song titles (strip feat./remix/radio edit/version/commentary descriptors)
 * 2. Fix broken/wrong/awkward clues
 * 3. Clean artist hints format
 * 4. Replace 8 obscure songs via Claude
 * 5. Update schedule.json for replaced songs
 *
 * Usage: node scripts/polish-library.js
 */

const Anthropic = require("@anthropic-ai/sdk");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env.local") });

const SONGS_PATH = path.join(__dirname, "../data/songs.json");
const SCHEDULE_PATH = path.join(__dirname, "../data/schedule.json");

// ── 1. Title normalization ────────────────────────────────────────────────────
// Strip feat./remix/radio edit/version/commentary from title display
function cleanTitle(title) {
  return title
    .replace(/\s*\(feat\..*?\)/gi, "")
    .replace(/\s*\(ft\..*?\)/gi, "")
    .replace(/\s*\(Feat\..*?\)/g, "")
    .replace(/\s*feat\..*$/gi, "")
    .replace(/\s*FEAT\..*$/g, "")
    .replace(/\s*\(with\s.*?\)/gi, "")
    .replace(/\s*\[.*?\]/g, "")
    .replace(/\s*-\s*(radio edit|single version|commentary|mono version|trippie mix|studio recording.*|felix jaehn.*|mike cruz.*|steppin.*|dusk remix|si begg.*|midnight express.*|mb da funk.*|acoustic version)/gi, "")
    .replace(/\s*\(from dreamworks.*?\)/gi, "")
    .replace(/\s*\(from.*?\)/gi, "")
    .trim();
}

// ── 2. Clue fixes ─────────────────────────────────────────────────────────────
const CLUE_FIXES = {
  // Critical bugs: wrong pronouns / wrong meaning / broken grammar
  "shape-of-you":            "Form of You",           // was "Form of Me" — wrong pronoun
  "7-years":                 "Seven Seasons",          // was "A Decade Moments" — decade ≠ 7 years
  "island-in-the-sun":       "Isle in the Light",      // was "Archipelago Beneath The Stars" — wrong meaning
  "fix-you":                 "Repair You",             // was "Repair Me" — song is "Fix YOU"
  "all-the-small-things":    "Every Tiny Detail",      // was "Every The Tiny Objects" — broken grammar
  "cant-stop":               "Powerless to Halt",      // was "Unable Halt" — broken grammar

  // Strip feat./with from clues
  "give-me-everything-feat-nayer":              "Hand Me Everything",
  "679-feat-remy-boyz":                         "Six-Seven-Nine",
  "love-feat-zacari":                           "DEVOTION.",
  "wait-for-u-feat-drake-tems":                 "HOLD FOR YOU",
  "kiss-me-more-feat-sza":                      "Peck Me Further",
  "too-many-nights-feat-don-toliver-with-future": "Excessive Evenings",
  "trance-with-travis-scott-young-thug":        "Hypnosis",
  "power-trip-feat-miguel":                     "Control Quest",
  "i-had-some-help-feat-morgan-wallen":         "I Had Certain Support",
  "outside-feat-ellie-goulding":                "Exterior",
  "feel-so-close---radio-edit":                 "Sense So Near",
  "cheerleader---felix-jaehn-remix-radio-edit": "Pom Pom Girl",
  "moves-like-jagger---studio-recording-from-the-voice-performance": "Dances Like a Rock Legend",
  "dj-got-us-fallin-in-love-feat-pitbull":      "Spinner Had Us Dropping Into Romance",
  "cant-stop-the-feeling-from-dreamworks-animations-trolls": "Cannot Halt This Emotion",
  "levitating-feat-dababy":                     "Floating Skyward",

  // Too long / formal / awkward
  "we-fell-in-love-in-october":    "we tumbled into romance in autumn",
  "mr-brightside":                 "Mr. Optimist",
  "the-real-slim-shady":           "The Genuine Slender Specter",
  "my-own-worst-enemy":            "My Own Biggest Foe",
  "whats-my-age-again":            "How Many Years Have I Got?",
  "you-get-what-you-give":         "You Reap What You Sow",
  "everlong":                      "Endlessly Extended",
  "girls-just-want-to-have-fun":   "Women Simply Crave Amusement",
  "dont-stop-me-now":              "Never Halt Me Presently",
  "take-on-me":                    "Challenge Me",
  "dont-you-forget-about-me":      "Never Overlook Me",
  "africa":                        "The Motherland",
  "viva-la-vida":                  "Long Live Life",
  "seven-nation-army":             "Seven Country Troops",
  "i-gotta-feeling":               "I Have a Premonition",
  "counting-stars":                "Tallying Galaxies",
  "all-about-that-bass":           "Everything About That Low End",
  "calm-down":                     "Cool Off",
  "birds-of-a-feather":            "Flock of Similar Kind",
  "dont-stop-the-music":           "Never Silence the Song",
  "the-less-i-know-the-better":    "The Fewer I Grasp the Finer",
  "new-person-same-old-mistakes":  "Fresh Face, Repeated Ancient Blunders",
  "whyd-you-only-call-me-when-youre-high": "Only Phoning When Intoxicated?",
  "the-adults-are-talking":        "The Grown-Ups Are Speaking",
  "no-role-modelz":                "Zero Icons to Follow",
  "falling-behind":                "Dropping Rearward",
  "the-hardest-part":              "The Toughest Bit",
  "get-lucky":                     "Score Big Tonight",
  "basket-case":                   "Crate Psycho",
  "closing-time":                  "Last Call Moment",
  "do-i-wanna-know":               "Shall I Even Want to Understand?",
  "take-me-to-church":             "Escort Me to the Chapel",
  "time-of-our-lives":             "Season of Our Lives",
  "somebody-told-me":              "Someone Let Me Know",
  "dont-look-back-in-anger":       "Never Peer Behind in Rage",
  "viva-la-vida":                  "Long Live Life",
  "dont-stop-believin":            "Never Cease Having Faith",
  "come-as-you-are":               "Show Up As You Are",
};

// ── 3. Hint fixes (hints[2] = artist, hints[0] = alt synonym) ────────────────
// Format: id → [new_hints0_or_null, new_hints1_or_null, new_hints2_or_null]
const HINT_FIXES = {
  // Artist field cleanup (hints[2])
  "give-me-everything-feat-nayer":              [null, null, "Artist: Pitbull"],
  "she-will":                                   [null, null, "Artist: Lil Wayne"],
  "wait-a-minute":                              [null, null, "Artist: WILLOW"],
  "sign-of-the-times":                          [null, "Pop rock", "Artist: Harry Styles"],
  "power-trip-feat-miguel":                     [null, null, "Artist: J. Cole"],
  "love-feat-zacari":                           [null, null, "Artist: Kendrick Lamar"],
  "wait-for-u-feat-drake-tems":                 [null, null, "Artist: Future"],
  "kiss-me-more-feat-sza":                      [null, null, "Artist: Doja Cat"],
  "too-many-nights-feat-don-toliver-with-future": [null, null, "Artist: Metro Boomin"],
  "trance-with-travis-scott-young-thug":        [null, null, "Artist: Metro Boomin"],
  "outside-feat-ellie-goulding":                [null, null, "Artist: Calvin Harris"],
  "uptown-funk-feat-bruno-mars":                [null, null, "Artist: Mark Ronson"],
  "dj-got-us-fallin-in-love-feat-pitbull":      [null, null, "Artist: Usher"],
  "moves-like-jagger---studio-recording-from-the-voice-performance": [null, null, "Artist: Maroon 5"],
  "latch":                                      [null, null, "Artist: Disclosure"],
  "no-lie":                                     [null, null, "Artist: Sean Paul"],
  "hold-on":                                    [null, null, "Artist: The Internet"],
  "falling-behind":                             [null, null, "Artist: Laufey"],
  "new-person-same-old-mistakes":               [null, null, "Artist: Tame Impala"],
  "let-it-happen":                              [null, null, "Artist: Tame Impala"],
  "eventually":                                 [null, null, "Artist: Tame Impala"],
  "3005":                                       [null, null, "Artist: Childish Gambino"],
  "promiscuous":                                [null, null, "Artist: Nelly Furtado"],
  "feel-good-inc":                              [null, null, "Artist: Gorillaz"],
  "yeah-feat-lil-jon-ludacris":                 [null, null, "Artist: Usher"],
  "all-falls-down":                             [null, null, "Artist: Kanye West"],
  "i-had-some-help-feat-morgan-wallen":         [null, null, "Artist: Post Malone"],
  "luther-with-sza":                            [null, null, "Artist: Kendrick Lamar"],

  // hints[0] (alt synonym) fixes
  "all-the-small-things":  ["Every Minor Trinket", null, null],   // was "All Minuscule Stuff" — uses "All"
  "island-in-the-sun":     ["Isolated Atoll in Sunshine", null, null], // was wrong
  "cant-stop":             ["Cannot Be Halted", null, null],
  "mr-brightside":         ["Mr. Sunny View", null, null],
};

// ── 4. Songs to replace entirely ─────────────────────────────────────────────
const REPLACE_SONGS = [
  // [old_id, new_title, new_artist, new_year, new_difficulty]
  ["first-kiss---commentary",    "Sorry",           "Justin Bieber",          "2015", "easy"],
  ["good-lovin---single-version","Love Yourself",   "Justin Bieber",          "2015", "easy"],
  ["never-ever-mike-cruz-radio-mix","Havana",        "Camila Cabello",         "2017", "easy"],
  ["groovin",                    "7 Rings",          "Ariana Grande",          "2019", "easy"],
  ["ok-love-you-bye",            "Can't Feel My Face","The Weeknd",            "2015", "easy"],
  ["party-4-u",                  "Treat You Better", "Shawn Mendes",           "2016", "easy"],
  ["those-years-are-over",       "thank u, next",    "Ariana Grande",          "2018", "medium"],
  ["what-more-can-i-say",        "Redbone",          "Childish Gambino",       "2016", "hard"],
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function toSlug(str) {
  return str.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
}

async function generateEntry(client, title, artist, releaseYear, difficulty) {
  const prompt = `You are creating content for TuneTwist, a daily music game where players decode synonym-transformed song titles.

Song: "${title}" by ${artist} (${releaseYear})
Difficulty: ${difficulty}

Rules:
- synonymTitle: Replace key words with synonyms. NEVER use any word from the real title. NEVER use the artist name. No feat./remix tags. Keep it concise (2–5 words). Natural, human phrasing.
  - easy: 1–2 obvious synonym swaps, instantly solvable
  - medium: 2–3 swaps, slightly less obvious
  - hard: more abstract synonyms
  - viral: clever/playful, beloved throwback feel
- hints: exactly 3 strings:
  1. A DIFFERENT synonym title (different words from synonymTitle, still no title words)
  2. Genre only, no year (e.g. "Pop", "R&B", "Hip-hop")
  3. "Artist: ${artist}"
- id: lowercase hyphenated slug of "${title}" only

Respond with ONLY valid JSON:
{
  "id": "...",
  "title": "${title}",
  "artist": "${artist}",
  "releaseYear": "${releaseYear}",
  "synonymTitle": "...",
  "difficulty": "${difficulty}",
  "hints": ["...", "...", "..."]
}`;

  try {
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    });
    const text = msg.content[0].text.trim();
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const song = JSON.parse(match[0]);
    if (!song.synonymTitle || !song.difficulty || !Array.isArray(song.hints) || song.hints.length !== 3) return null;
    if (song.synonymTitle.toLowerCase() === title.toLowerCase()) return null;
    return song;
  } catch (e) {
    return null;
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n✨ TuneTwist Final Polish Pass\n");

  let songs = JSON.parse(fs.readFileSync(SONGS_PATH, "utf-8"));
  let schedule = JSON.parse(fs.readFileSync(SCHEDULE_PATH, "utf-8"));

  console.log(`📚 Library: ${songs.length} songs`);

  // ── Step 1: Normalize titles ──────────────────────────────────────────────
  console.log("\n📝 Normalizing titles...");
  let titleFixed = 0;
  for (const s of songs) {
    const clean = cleanTitle(s.title);
    if (clean !== s.title) {
      console.log(`  "${s.title}" → "${clean}"`);
      s.title = clean;
      titleFixed++;
    }
  }
  console.log(`  Fixed ${titleFixed} titles`);

  // ── Step 2: Apply clue fixes ──────────────────────────────────────────────
  console.log("\n🎯 Fixing clues...");
  let clueFixed = 0;
  for (const s of songs) {
    if (CLUE_FIXES[s.id]) {
      s.synonymTitle = CLUE_FIXES[s.id];
      clueFixed++;
    }
  }
  console.log(`  Fixed ${clueFixed} clues`);

  // ── Step 3: Apply hint fixes ──────────────────────────────────────────────
  console.log("\n💡 Fixing hints...");
  let hintFixed = 0;
  for (const s of songs) {
    if (HINT_FIXES[s.id]) {
      const [h0, h1, h2] = HINT_FIXES[s.id];
      if (h0) s.hints[0] = h0;
      if (h1) s.hints[1] = h1;
      if (h2) s.hints[2] = h2;
      hintFixed++;
    }
  }
  console.log(`  Fixed ${hintFixed} hint entries`);

  // ── Step 4: Replace obscure songs ────────────────────────────────────────
  console.log(`\n🔄 Replacing ${REPLACE_SONGS.length} obscure songs via Claude...\n`);

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const existingTitles = new Set(songs.map((s) => s.title.toLowerCase()));
  const existingIds = new Set(songs.map((s) => s.id));

  const replacementMap = {}; // old_id → new_id

  for (const [oldId, newTitle, newArtist, newYear, newDiff] of REPLACE_SONGS) {
    // Skip if new title already exists
    if (existingTitles.has(newTitle.toLowerCase())) {
      console.log(`  Skipping "${newTitle}" — already in library`);
      // Still need to remove the old one from library
      songs = songs.filter((s) => s.id !== oldId);
      // Find existing entry
      const existing = songs.find((s) => s.title.toLowerCase() === newTitle.toLowerCase());
      if (existing) replacementMap[oldId] = existing.id;
      continue;
    }

    process.stdout.write(`  Replacing [${oldId}] with "${newTitle}" — ${newArtist} ... `);

    const song = await generateEntry(client, newTitle, newArtist, newYear, newDiff);

    if (song) {
      // Ensure unique ID
      let id = toSlug(newTitle);
      let suffix = 1;
      while (existingIds.has(id)) id = `${toSlug(newTitle)}-${suffix++}`;
      song.id = id;

      // Remove old entry, add new
      songs = songs.filter((s) => s.id !== oldId);
      songs.push(song);

      existingIds.delete(oldId);
      existingIds.add(id);
      existingTitles.add(newTitle.toLowerCase());

      replacementMap[oldId] = id;
      console.log(`✓ [${song.difficulty}] → ${id}`);
    } else {
      console.log(`✗ failed — keeping old entry`);
    }

    await new Promise((r) => setTimeout(r, 120));
  }

  // ── Step 5: Update schedule with new IDs ─────────────────────────────────
  if (Object.keys(replacementMap).length > 0) {
    console.log("\n📅 Updating schedule references...");
    let schedUpdates = 0;
    for (const [date, ids] of Object.entries(schedule)) {
      const updated = ids.map((id) => replacementMap[id] ?? id);
      if (updated.join(",") !== ids.join(",")) {
        schedule[date] = updated;
        schedUpdates++;
      }
    }
    console.log(`  Updated ${schedUpdates} schedule dates`);
  }

  // ── Step 6: Write files ───────────────────────────────────────────────────
  fs.writeFileSync(SONGS_PATH, JSON.stringify(songs, null, 2));
  fs.writeFileSync(SCHEDULE_PATH, JSON.stringify(schedule, null, 2));

  // ── Summary ───────────────────────────────────────────────────────────────
  const byDiff = { easy: 0, medium: 0, hard: 0, viral: 0 };
  songs.forEach((s) => { if (s.difficulty in byDiff) byDiff[s.difficulty]++; });

  // Verify zero 30-day duplicates
  const dates = Object.keys(schedule).sort();
  const songMap = Object.fromEntries(songs.map((s) => [s.id, s]));
  let dups30 = 0;
  for (let i = 0; i < dates.length; i++) {
    for (const id of schedule[dates[i]]) {
      for (let back = 1; back < 30; back++) {
        const j = i - back;
        if (j < 0) break;
        if (schedule[dates[j]].includes(id)) { dups30++; break; }
      }
    }
  }
  let missingLib = 0;
  for (const ids of Object.values(schedule)) {
    for (const id of ids) { if (!songMap[id]) missingLib++; }
  }

  console.log(`\n✅ Done!`);
  console.log(`📦 Library: ${songs.length} songs | Easy:${byDiff.easy} Med:${byDiff.medium} Hard:${byDiff.hard} Viral:${byDiff.viral}`);
  console.log(`📅 Schedule: ${dates.length} days | ${dates[0]} → ${dates[dates.length-1]}`);
  console.log(`🔁 30-day duplicates: ${dups30}`);
  console.log(`❓ Missing library entries: ${missingLib}\n`);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
