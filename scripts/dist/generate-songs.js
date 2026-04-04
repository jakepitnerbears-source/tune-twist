"use strict";
/**
 * generate-songs.ts
 *
 * Fetches popular songs from Spotify across eras/genres,
 * generates synonym titles + hints via Claude, and appends
 * new entries to data/songs.json.
 *
 * Usage:
 *   npx ts-node --skip-project scripts/generate-songs.ts --count 50
 *   npx ts-node --skip-project scripts/generate-songs.ts --count 50 --era 90s --difficulty hard
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const dotenv = __importStar(require("dotenv"));
// __dirname is scripts/dist when compiled, so go up two levels to project root
dotenv.config({ path: path.join(__dirname, "../../.env.local") });
// ── Config ────────────────────────────────────────────────────────────────────
const SONGS_PATH = path.join(__dirname, "../../data/songs.json");
const SEARCH_QUERIES = [
    "genre:pop year:2010-2012",
    "genre:pop year:2012-2014",
    "genre:pop year:2014-2016",
    "genre:pop year:2016-2018",
    "genre:pop year:2018-2020",
    "genre:pop year:2020-2022",
    "genre:pop year:2022-2024",
    "genre:hip-hop year:2010-2013",
    "genre:hip-hop year:2013-2016",
    "genre:hip-hop year:2016-2019",
    "genre:hip-hop year:2019-2022",
    "genre:r-n-b year:2010-2015",
    "genre:r-n-b year:2015-2020",
    "genre:r-n-b year:2020-2024",
    "genre:rock year:2000-2005",
    "genre:rock year:2005-2010",
    "genre:rock year:2010-2015",
    "genre:rock year:2015-2020",
    "genre:indie year:2010-2015",
    "genre:indie year:2015-2020",
    "genre:pop year:2000-2005",
    "genre:pop year:2005-2010",
    "genre:dance year:2010-2015",
    "genre:dance year:2015-2020",
    "genre:soul year:2010-2018",
    "genre:country year:2010-2018",
    "genre:rap year:2015-2020",
    "genre:rap year:2020-2024",
    "genre:pop year:1995-2000",
    "genre:rock year:1995-2000",
];
// ── Spotify auth ──────────────────────────────────────────────────────────────
async function getSpotifyToken() {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const res = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
    });
    const data = await res.json();
    return data.access_token;
}
// ── Spotify search ────────────────────────────────────────────────────────────
async function searchTracks(token, query, limit = 10) {
    const params = new URLSearchParams({
        q: query,
        type: "track",
        limit: String(limit),
        market: "US",
    });
    const res = await fetch(`https://api.spotify.com/v1/search?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return data.tracks?.items ?? [];
}
// ── Claude generation ─────────────────────────────────────────────────────────
async function generateSongEntry(client, title, artist, releaseYear, existingTitles) {
    const prompt = `You are creating content for TuneDecode, a daily music word game where players decode synonym-transformed song titles.

Song: "${title}" by ${artist} (${releaseYear})

Generate a JSON object for this song. Rules:
- synonymTitle: Replace key words with synonyms. Make it challenging but fair.
  - CRITICAL: NEVER include any word from the real song title in synonymTitle. Every key word must be replaced.
  - CRITICAL: NEVER include the artist's name or any part of it in synonymTitle.
  - CRITICAL: Do NOT include feat., ft., featuring, remix, official, audio, video, or any extra tags. Only the synonym title itself.
  - Easy: 1-2 obvious synonym swaps (e.g. "Shape" → "Form")
  - Medium: 2-3 swaps, slightly less obvious
  - Hard: 3+ swaps, more abstract synonyms
  - Viral: clever/playful swap for a well-known throwback or viral hit
- difficulty: assign based on how hard the synonym title is to decode:
  - "easy" for massive mainstream hits with simple swaps
  - "medium" for well-known songs with moderate swaps
  - "hard" for songs where synonyms are more abstract
  - "viral" for songs that went hugely viral on TikTok or are beloved 90s/00s throwbacks
- hints: exactly 3 strings in this exact order:
  1. Genre and era (e.g. "2010s pop")
  2. Partial title with blanks showing first letter of each key word (e.g. "S_____ of You")
  3. Artist clue (e.g. "Artist: Ed Sheeran")
- id: lowercase hyphenated version of the title (e.g. "shape-of-you")

Respond with ONLY a valid JSON object, no explanation:
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
        const message = await client.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 300,
            messages: [{ role: "user", content: prompt }],
        });
        const text = message.content[0].text.trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch)
            return null;
        const song = JSON.parse(jsonMatch[0]);
        // Validate shape
        if (!song.id || !song.synonymTitle || !song.difficulty ||
            !Array.isArray(song.hints) || song.hints.length !== 3)
            return null;
        // Skip if synonym title is the same as the real title
        if (song.synonymTitle.toLowerCase() === title.toLowerCase())
            return null;
        return song;
    }
    catch {
        return null;
    }
}
// ── Slug helpers ──────────────────────────────────────────────────────────────
function toSlug(str) {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
}
// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
    const args = process.argv;
    const countIdx = args.indexOf("--count");
    const countVal = countIdx !== -1 ? args[countIdx + 1] : undefined;
    const targetCount = parseInt(countVal ?? "50", 10);
    console.log(`\n🎵 TuneDecode Song Generator`);
    console.log(`Target: ${targetCount} new songs\n`);
    // Load existing library
    let existing = [];
    if (fs.existsSync(SONGS_PATH)) {
        existing = JSON.parse(fs.readFileSync(SONGS_PATH, "utf-8"));
        console.log(`📚 Existing library: ${existing.length} songs`);
    }
    const existingIds = new Set(existing.map((s) => s.id));
    const existingTitles = new Set(existing.map((s) => s.title.toLowerCase()));
    // Get Spotify token
    console.log("🔑 Authenticating with Spotify...");
    const token = await getSpotifyToken();
    // Collect candidate tracks
    console.log("🔍 Fetching tracks from Spotify...");
    const allTracks = [];
    const seenNames = new Set();
    for (const query of SEARCH_QUERIES) {
        const tracks = await searchTracks(token, query, 10);
        for (const t of tracks) {
            const key = `${t.name.toLowerCase()}:::${t.artists[0]?.name.toLowerCase()}`;
            if (!seenNames.has(key)) {
                seenNames.add(key);
                allTracks.push(t);
            }
        }
        // Small delay to avoid rate limiting
        await new Promise((r) => setTimeout(r, 200));
    }
    // Filter already-known songs
    const candidates = allTracks
        .filter((t) => !existingTitles.has(t.name.toLowerCase()))
        .filter((t) => t.name.length > 1);
    console.log(`📋 ${candidates.length} candidate tracks found\n`);
    // Generate song entries via Claude
    const client = new sdk_1.default({ apiKey: process.env.ANTHROPIC_API_KEY });
    const newSongs = [];
    let processed = 0;
    for (const track of candidates) {
        if (newSongs.length >= targetCount)
            break;
        // Strip feat./tags from track name so synonymTitle never inherits them
        const title = track.name
            .replace(/\s*\(feat\..*?\)/gi, "")
            .replace(/\s*\(ft\..*?\)/gi, "")
            .replace(/\s*\(with\s.*?\)/gi, "")
            .replace(/\s*\[.*?\]/g, "")
            .replace(/\s*-\s*(official|audio|video|lyric|remix|remaster).*$/gi, "")
            .trim();
        const artist = track.artists.map((a) => a.name).join(", ");
        const releaseYear = track.album.release_date.split("-")[0];
        const slug = toSlug(title);
        if (existingIds.has(slug))
            continue;
        process.stdout.write(`  [${newSongs.length + 1}/${targetCount}] "${title}" — ${artist} ... `);
        const song = await generateSongEntry(client, title, artist, releaseYear, existingTitles);
        if (song) {
            // Ensure unique ID
            let id = slug;
            let suffix = 1;
            while (existingIds.has(id)) {
                id = `${slug}-${suffix++}`;
            }
            song.id = id;
            existingIds.add(id);
            existingTitles.add(title.toLowerCase());
            newSongs.push(song);
            console.log(`✓ (${song.difficulty})`);
        }
        else {
            console.log(`✗ skipped`);
        }
        processed++;
        // Brief pause between Claude calls
        await new Promise((r) => setTimeout(r, 150));
    }
    // Save to songs.json
    const updated = [...existing, ...newSongs];
    fs.mkdirSync(path.dirname(SONGS_PATH), { recursive: true });
    fs.writeFileSync(SONGS_PATH, JSON.stringify(updated, null, 2));
    console.log(`\n✅ Done! Added ${newSongs.length} songs.`);
    console.log(`📦 Total library: ${updated.length} songs`);
    console.log(`💾 Saved to data/songs.json\n`);
    // Summary by difficulty
    const byDiff = { easy: 0, medium: 0, hard: 0, viral: 0 };
    for (const s of newSongs)
        byDiff[s.difficulty]++;
    console.log(`Breakdown of new songs:`);
    console.log(`  Easy:   ${byDiff.easy}`);
    console.log(`  Medium: ${byDiff.medium}`);
    console.log(`  Hard:   ${byDiff.hard}`);
    console.log(`  Viral:  ${byDiff.viral}\n`);
}
main().catch((err) => {
    console.error("Error:", err.message);
    process.exit(1);
});
