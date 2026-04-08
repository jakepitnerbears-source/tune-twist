#!/usr/bin/env node
/**
 * cleanup-library.js
 *
 * 1. Removes obscure/junk/broken songs from songs.json
 * 2. Fixes corrupted IDs (blindingLights2 → save-your-tears, etc.)
 * 3. Fixes schedule.json references accordingly
 * 4. Adds ~100 quality replacement songs via Claude API
 * 5. Wipes and regenerates schedule.json
 *
 * Usage: node scripts/cleanup-library.js
 */

const Anthropic = require("@anthropic-ai/sdk");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env.local") });

const SONGS_PATH = path.join(__dirname, "../data/songs.json");
const SCHEDULE_PATH = path.join(__dirname, "../data/schedule.json");

// ── IDs to remove entirely ────────────────────────────────────────────────────
const REMOVE_IDS = new Set([
  // Corrupted IDs — content now exists under correct IDs
  "levitating2",              // "Physical" → now 'physical'
  "smells-like-teen-spirit-2",// "Come As You Are" → now 'come-as-you-are'
  "mr-brightside-2",          // "Somebody Told Me" → now 'somebody-told-me'

  // Easy — unknown/niche artists
  "pack-your-bags", "after-party-remix", "high", "passenger",
  "king-me", "haircut", "diamonds", "soldier-boy",
  "aprendi", "obsession", "without-him",

  // Medium — unknown/niche artists or bad formats
  "shdy-nate-intro", "who-dem", "coffeee", "kickstart",
  "carry-on", "im-in-the-kitchen", "fire-in-the-hole", "pimpin-as-a-mack",
  "star-of-show", "no-graft-no-gain", "the-growing-addiction---remix",
  "big-things", "frozen-gang-intro", "uncle-sam",
  "hung-up---midnight-express-mb-da-funk-mix",
  "come-on-let-go---midnight-express-easy-mix",
  "faded-images", "buccaneers", "kansas-city", "maze-of-madness",
  "aint-that-just-like-me-mono-version", "alright-mono",
  "stars", "right-place-wrong-time",
  "thrill-me---steppin-razor-mix", "your-song---acoustic-version",
  "beamer-tesla", "mass-public-transport", "phukk-what-u-thought", "impatient",

  // Hard — unknown/junk/instrumental/folk reels
  "kemst-samt-inn---dusk-remix",
  "rock-my-hologram---si-beggs-pleasure-principle-mix",
  "bahd-gyal-bubble", "why-you-always-hate---remastered",
  "i-am-we", "taghsim", "tigwilise-chikondi",
  "michael-haze---dej-ten-kush",
  "masons-apron-reel-variations", "last-nights-fun-single-reel",
  "monaghan-jig-merrily-kiss-the-quakers-wife-slide",
  "kerry-reel-joe-cooleys-reel", "wise-maid-reel-musical-priest-single-reel",
  "kate-martins-waltz", "alfie", "river-jordan", "tomei-ni-aogu",
  "crowned-in-filth", "lonely-lil-rhody", "nightside",
  "goat-talk", "06", "labello---instrumental", "kompos",

  // Viral — clearly wrong
  "among-us-rap",
]);

// ── ID renames (apply in both songs.json and schedule.json) ───────────────────
const RENAME_IDS = { "blindingLights2": "save-your-tears" };

// ── Schedule ID substitutions (bad id → correct existing id) ─────────────────
const SCHED_SUBS = {
  "levitating2":              "physical",
  "smells-like-teen-spirit-2":"come-as-you-are",
  "mr-brightside-2":          "somebody-told-me",
};

// ── New songs to add ──────────────────────────────────────────────────────────
const NEW_SONGS = [
  // EASY
  { title: "Shape of You",         artist: "Ed Sheeran",                          releaseYear: "2017" },
  { title: "Rolling in the Deep",  artist: "Adele",                               releaseYear: "2010" },
  { title: "Blinding Lights",      artist: "The Weeknd",                          releaseYear: "2019" },
  { title: "Closer",               artist: "The Chainsmokers ft. Halsey",         releaseYear: "2016" },
  { title: "Señorita",             artist: "Shawn Mendes & Camila Cabello",        releaseYear: "2019" },
  { title: "Perfect",              artist: "Ed Sheeran",                          releaseYear: "2017" },
  { title: "Stay With Me",         artist: "Sam Smith",                           releaseYear: "2014" },
  { title: "Love Story",           artist: "Taylor Swift",                        releaseYear: "2008" },
  { title: "I Gotta Feeling",      artist: "Black Eyed Peas",                     releaseYear: "2009" },
  { title: "Just Dance",           artist: "Lady Gaga",                           releaseYear: "2008" },
  { title: "Born This Way",        artist: "Lady Gaga",                           releaseYear: "2011" },
  { title: "Payphone",             artist: "Maroon 5",                            releaseYear: "2012" },
  { title: "Chasing Cars",         artist: "Snow Patrol",                         releaseYear: "2006" },
  { title: "Thinking Out Loud",    artist: "Ed Sheeran",                          releaseYear: "2014" },
  { title: "Price Tag",            artist: "Jessie J",                            releaseYear: "2011" },

  // MEDIUM
  { title: "Mirrors",              artist: "Justin Timberlake",                   releaseYear: "2013" },
  { title: "Chandelier",           artist: "Sia",                                 releaseYear: "2014" },
  { title: "Counting Stars",       artist: "OneRepublic",                         releaseYear: "2013" },
  { title: "Pompeii",              artist: "Bastille",                            releaseYear: "2013" },
  { title: "Wake Me Up",           artist: "Avicii",                              releaseYear: "2013" },
  { title: "Photograph",           artist: "Ed Sheeran",                          releaseYear: "2014" },
  { title: "7 Years",              artist: "Lukas Graham",                        releaseYear: "2015" },
  { title: "In My Blood",          artist: "Shawn Mendes",                        releaseYear: "2018" },
  { title: "Sucker",               artist: "Jonas Brothers",                      releaseYear: "2019" },
  { title: "Circles",              artist: "Post Malone",                         releaseYear: "2019" },
  { title: "Mood",                 artist: "24kGoldn ft. iann dior",              releaseYear: "2020" },
  { title: "Peaches",              artist: "Justin Bieber",                       releaseYear: "2021" },
  { title: "Butter",               artist: "BTS",                                 releaseYear: "2021" },
  { title: "traitor",              artist: "Olivia Rodrigo",                      releaseYear: "2021" },
  { title: "Unholy",               artist: "Sam Smith & Kim Petras",              releaseYear: "2022" },
  { title: "Calm Down",            artist: "Rema & Selena Gomez",                 releaseYear: "2022" },
  { title: "Vampire",              artist: "Olivia Rodrigo",                      releaseYear: "2023" },
  { title: "Espresso",             artist: "Sabrina Carpenter",                   releaseYear: "2024" },
  { title: "Birds of a Feather",   artist: "Billie Eilish",                      releaseYear: "2024" },
  { title: "Bang Bang",            artist: "Jessie J, Ariana Grande & Nicki Minaj", releaseYear: "2014" },
  { title: "All About That Bass",  artist: "Meghan Trainor",                      releaseYear: "2014" },
  { title: "Shut Up and Dance",    artist: "WALK THE MOON",                       releaseYear: "2014" },
  { title: "Hotline Bling",        artist: "Drake",                               releaseYear: "2015" },
  { title: "Bad Blood",            artist: "Taylor Swift",                        releaseYear: "2014" },
  { title: "Needed Me",            artist: "Rihanna",                             releaseYear: "2016" },
  { title: "Please Please Please", artist: "Sabrina Carpenter",                   releaseYear: "2024" },

  // HARD
  { title: "Midnight City",        artist: "M83",                                 releaseYear: "2011" },
  { title: "Electric Feel",        artist: "MGMT",                                releaseYear: "2008" },
  { title: "The Scientist",        artist: "Coldplay",                            releaseYear: "2002" },
  { title: "Fix You",              artist: "Coldplay",                            releaseYear: "2005" },
  { title: "Clocks",               artist: "Coldplay",                            releaseYear: "2002" },
  { title: "Boulevard of Broken Dreams", artist: "Green Day",                    releaseYear: "2004" },
  { title: "American Idiot",       artist: "Green Day",                           releaseYear: "2004" },
  { title: "Under the Bridge",     artist: "Red Hot Chili Peppers",               releaseYear: "1992" },
  { title: "Black Hole Sun",       artist: "Soundgarden",                         releaseYear: "1994" },
  { title: "Creep",                artist: "Radiohead",                           releaseYear: "1993" },
  { title: "Wonderwall",           artist: "Oasis",                               releaseYear: "1995" },
  { title: "Basket Case",          artist: "Green Day",                           releaseYear: "1994" },
  { title: "Semi-Charmed Life",    artist: "Third Eye Blind",                     releaseYear: "1997" },
  { title: "Closing Time",         artist: "Semisonic",                           releaseYear: "1998" },
  { title: "Go Your Own Way",      artist: "Fleetwood Mac",                       releaseYear: "1977" },
  { title: "Dreams",               artist: "Fleetwood Mac",                       releaseYear: "1977" },
  { title: "Work Song",            artist: "Hozier",                              releaseYear: "2014" },
  { title: "Heathens",             artist: "Twenty One Pilots",                   releaseYear: "2016" },
  { title: "Get Lucky",            artist: "Daft Punk ft. Pharrell Williams",     releaseYear: "2013" },
  { title: "R U Mine?",            artist: "Arctic Monkeys",                      releaseYear: "2013" },
  { title: "Somebody Else",        artist: "The 1975",                            releaseYear: "2016" },
  { title: "The Chain",            artist: "Fleetwood Mac",                       releaseYear: "1977" },
  { title: "Losing My Religion",   artist: "R.E.M.",                              releaseYear: "1991" },
  { title: "Jeremy",               artist: "Pearl Jam",                           releaseYear: "1991" },
  { title: "Slide",                artist: "Goo Goo Dolls",                       releaseYear: "1998" },

  // VIRAL
  { title: "Africa",               artist: "Toto",                                releaseYear: "1982" },
  { title: "Take On Me",           artist: "A-ha",                                releaseYear: "1985" },
  { title: "Girls Just Want to Have Fun", artist: "Cyndi Lauper",                releaseYear: "1983" },
  { title: "Don't Stop Me Now",    artist: "Queen",                               releaseYear: "1978" },
  { title: "Sweet Caroline",       artist: "Neil Diamond",                        releaseYear: "1969" },
  { title: "Come On Eileen",       artist: "Dexys Midnight Runners",              releaseYear: "1982" },
  { title: "Walking on Sunshine",  artist: "Katrina and the Waves",               releaseYear: "1985" },
  { title: "99 Red Balloons",      artist: "Nena",                                releaseYear: "1983" },
  { title: "Tubthumping",          artist: "Chumbawamba",                         releaseYear: "1997" },
  { title: "Jump Around",          artist: "House of Pain",                       releaseYear: "1992" },
  { title: "Baby Got Back",        artist: "Sir Mix-a-Lot",                       releaseYear: "1992" },
  { title: "Waterfalls",           artist: "TLC",                                 releaseYear: "1994" },
  { title: "No Scrubs",            artist: "TLC",                                 releaseYear: "1999" },
  { title: "Say My Name",          artist: "Destiny's Child",                     releaseYear: "1999" },
  { title: "Crazy in Love",        artist: "Beyoncé",                             releaseYear: "2003" },
  { title: "In Da Club",           artist: "50 Cent",                             releaseYear: "2003" },
  { title: "Get Low",              artist: "Lil Jon & The East Side Boyz",        releaseYear: "2003" },
  { title: "Complicated",          artist: "Avril Lavigne",                       releaseYear: "2002" },
  { title: "Sk8er Boi",            artist: "Avril Lavigne",                       releaseYear: "2002" },
  { title: "Hollaback Girl",       artist: "Gwen Stefani",                        releaseYear: "2004" },
  { title: "Stacy's Mom",          artist: "Fountains of Wayne",                  releaseYear: "2003" },
  { title: "I Will Survive",       artist: "Gloria Gaynor",                       releaseYear: "1978" },
  { title: "Dancing Queen",        artist: "ABBA",                                releaseYear: "1976" },
  { title: "Mamma Mia",            artist: "ABBA",                                releaseYear: "1975" },
  { title: "Tainted Love",         artist: "Soft Cell",                           releaseYear: "1981" },
  { title: "Don't You (Forget About Me)", artist: "Simple Minds",                releaseYear: "1985" },
  { title: "Material Girl",        artist: "Madonna",                             releaseYear: "1984" },
  { title: "Like a Prayer",        artist: "Madonna",                             releaseYear: "1989" },
  { title: "Thriller",             artist: "Michael Jackson",                     releaseYear: "1982" },
  { title: "Billie Jean",          artist: "Michael Jackson",                     releaseYear: "1982" },
  { title: "Survivor",             artist: "Destiny's Child",                     releaseYear: "2001" },
  { title: "Lady Marmalade",       artist: "Christina Aguilera, Lil' Kim, Mýa & Pink", releaseYear: "2001" },
  { title: "Whoomp! (There It Is)","artist": "Tag Team",                          releaseYear: "1993" },
  { title: "Under Pressure",       artist: "Queen & David Bowie",                 releaseYear: "1981" },
  { title: "Hey Jude",             artist: "The Beatles",                         releaseYear: "1968" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function toSlug(str) {
  return str.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
}

async function generateEntry(client, title, artist, releaseYear, existingTitles) {
  const prompt = `You are creating content for TuneTwist, a daily music word game where players decode synonym-transformed song titles.

Song: "${title}" by ${artist} (${releaseYear})

Generate a JSON object. Rules:
- synonymTitle: Replace ALL key words with synonyms. NEVER include any word from the real title. NEVER include the artist name. No feat./remix/version tags. Keep it short (2–5 words usually).
  - Easy: 1–2 obvious swaps. Should feel solvable.
  - Medium: 2–3 swaps, slightly less obvious.
  - Hard: 3+ swaps, more abstract — but still fair.
  - Viral: clever/playful swap for a beloved throwback or viral hit.
- difficulty: assign based on recognizability AND synonym complexity.
  - "easy" = mega-hit with simple swaps
  - "medium" = well-known with moderate swaps
  - "hard" = recognizable but synonyms require more thought
  - "viral" = beloved throwback / TikTok-era meme / crowd favourite
- hints: exactly 3 strings:
  1. A second synonym title using COMPLETELY DIFFERENT words from synonymTitle (2–5 words, no title words, no artist)
  2. Genre only, no year prefix (e.g. "Pop", "R&B", "Rock/alternative")
  3. Artist credit (e.g. "Artist: Ed Sheeran")
- id: lowercase hyphenated slug of the real title

Respond with ONLY valid JSON:
{
  "id": "...",
  "title": "${title}",
  "artist": "${artist}",
  "releaseYear": "${releaseYear}",
  "synonymTitle": "...",
  "difficulty": "easy|medium|hard|viral",
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
  } catch {
    return null;
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🧹 TuneTwist Library Cleanup\n");

  // Load data
  let songs = JSON.parse(fs.readFileSync(SONGS_PATH, "utf-8"));
  let schedule = JSON.parse(fs.readFileSync(SCHEDULE_PATH, "utf-8"));

  console.log(`📚 Library before: ${songs.length} songs`);
  console.log(`📅 Schedule before: ${Object.keys(schedule).length} days`);

  // ── Step 1: Apply ID renames ──────────────────────────────────────────────
  console.log("\n🔧 Fixing corrupted IDs...");
  for (const [oldId, newId] of Object.entries(RENAME_IDS)) {
    const song = songs.find((s) => s.id === oldId);
    if (song) {
      song.id = newId;
      console.log(`  Renamed: ${oldId} → ${newId}`);
    }
    // Update schedule references
    for (const [date, ids] of Object.entries(schedule)) {
      schedule[date] = ids.map((id) => (id === oldId ? newId : id));
    }
  }

  // ── Step 2: Apply schedule substitutions (bad id → correct existing id) ───
  console.log("\n🔄 Fixing schedule references...");
  for (const [badId, correctId] of Object.entries(SCHED_SUBS)) {
    let count = 0;
    for (const [date, ids] of Object.entries(schedule)) {
      const updated = ids.map((id) => (id === badId ? correctId : id));
      if (updated.join(",") !== ids.join(",")) {
        schedule[date] = updated;
        count++;
      }
    }
    if (count) console.log(`  ${badId} → ${correctId} (${count} dates)`);
  }

  // ── Step 3: Fix "Waterfall" → "Waterfalls" (TLC typo) ────────────────────
  const waterfall = songs.find((s) => s.id === "waterfall" && s.artist === "TLC");
  if (waterfall) {
    waterfall.title = "Waterfalls";
    console.log('\n✏️  Fixed: "Waterfall" → "Waterfalls" (TLC)');
  }

  // ── Step 4: Remove obscure/junk songs ────────────────────────────────────
  console.log("\n🗑️  Removing obscure songs...");
  const before = songs.length;
  songs = songs.filter((s) => !REMOVE_IDS.has(s.id));
  console.log(`  Removed ${before - songs.length} songs`);

  // Remove those IDs from schedule (mark affected dates)
  const affectedDates = new Set();
  for (const [date, ids] of Object.entries(schedule)) {
    const cleaned = ids.filter((id) => !REMOVE_IDS.has(id));
    if (cleaned.length < ids.length) {
      affectedDates.add(date);
      delete schedule[date]; // Will be regenerated
    }
  }
  console.log(`  Cleared ${affectedDates.size} schedule dates (will regenerate)`);

  // ── Step 5: Generate new song entries via Claude ──────────────────────────
  console.log(`\n🎵 Generating ${NEW_SONGS.length} new song entries...\n`);

  const existingIds = new Set(songs.map((s) => s.id));
  const existingTitles = new Set(songs.map((s) => s.title.toLowerCase()));

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const added = [];

  for (let i = 0; i < NEW_SONGS.length; i++) {
    const { title, artist, releaseYear } = NEW_SONGS[i];

    // Skip if already in library
    if (existingTitles.has(title.toLowerCase())) {
      console.log(`  [${i + 1}/${NEW_SONGS.length}] Skipping "${title}" (already exists)`);
      continue;
    }

    process.stdout.write(`  [${i + 1}/${NEW_SONGS.length}] "${title}" — ${artist} ... `);

    const song = await generateEntry(client, title, artist, releaseYear, existingTitles);

    if (song) {
      // Ensure unique ID
      let id = toSlug(title);
      let suffix = 1;
      while (existingIds.has(id)) id = `${toSlug(title)}-${suffix++}`;
      song.id = id;
      existingIds.add(id);
      existingTitles.add(title.toLowerCase());
      added.push(song);
      console.log(`✓ (${song.difficulty})`);
    } else {
      console.log(`✗ skipped`);
    }

    // Brief pause
    await new Promise((r) => setTimeout(r, 120));
  }

  console.log(`\n  Added ${added.length} new songs`);

  // ── Step 6: Write updated songs.json ─────────────────────────────────────
  const finalSongs = [...songs, ...added];
  fs.writeFileSync(SONGS_PATH, JSON.stringify(finalSongs, null, 2));

  // Write partial schedule (dates with removed songs already deleted above)
  fs.writeFileSync(SCHEDULE_PATH, JSON.stringify(schedule, null, 2));

  // ── Summary ───────────────────────────────────────────────────────────────
  const byDiff = { easy: 0, medium: 0, hard: 0, viral: 0 };
  finalSongs.forEach((s) => { if (s.difficulty in byDiff) byDiff[s.difficulty]++; });

  console.log(`\n✅ Done!`);
  console.log(`📦 Total library: ${finalSongs.length} songs`);
  console.log(`   Easy: ${byDiff.easy} | Medium: ${byDiff.medium} | Hard: ${byDiff.hard} | Viral: ${byDiff.viral}`);
  console.log(`📅 Remaining scheduled dates: ${Object.keys(schedule).length}`);
  console.log(`\nNext steps:`);
  console.log(`  1. Update VIRAL_REUSE_WINDOW in scripts/schedule-days.ts to 60`);
  console.log(`  2. Run: node scripts/dist/schedule-days.js --days 160 --start [earliest_missing_date]`);
  console.log(`  3. Run: node scripts/fix-schedule.js\n`);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
