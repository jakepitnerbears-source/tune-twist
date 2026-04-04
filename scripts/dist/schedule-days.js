"use strict";
/**
 * schedule-days.ts
 *
 * Fills schedule.json with daily puzzles from songs.json.
 * Picks 1 easy, 2 medium, 1 hard, 1 viral per day.
 * Never repeats a song within a 60-day window.
 *
 * Usage:
 *   npx ts-node --skip-project scripts/schedule-days.ts --days 90 --start 2026-04-02
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
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const SONGS_PATH = path.join(__dirname, "../../data/songs.json");
const SCHEDULE_PATH = path.join(__dirname, "../../data/schedule.json");
const REUSE_WINDOW = 60; // days before a song can repeat
const VIRAL_REUSE_WINDOW = 17; // viral pool is small, allow faster reuse
function parseArgs() {
    const args = process.argv.slice(2);
    const get = (flag) => {
        const i = args.indexOf(flag);
        return i !== -1 ? args[i + 1] : undefined;
    };
    return {
        days: parseInt(get("--days") ?? "90", 10),
        start: get("--start") ?? tomorrowStr(),
    };
}
function tomorrowStr() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
}
function addDays(dateStr, n) {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + n);
    return d.toISOString().split("T")[0];
}
function pickOne(pool, usedRecently) {
    const available = pool.filter((s) => !usedRecently.has(s.id));
    if (available.length === 0)
        return null;
    // Shuffle for variety
    const idx = Math.floor(Math.random() * available.length);
    return available[idx];
}
function main() {
    const { days, start } = parseArgs();
    if (!fs.existsSync(SONGS_PATH)) {
        console.error("❌ data/songs.json not found. Run generate-songs.ts first.");
        process.exit(1);
    }
    const songs = JSON.parse(fs.readFileSync(SONGS_PATH, "utf-8"));
    const byDiff = {
        easy: songs.filter((s) => s.difficulty === "easy"),
        medium: songs.filter((s) => s.difficulty === "medium"),
        hard: songs.filter((s) => s.difficulty === "hard"),
        viral: songs.filter((s) => s.difficulty === "viral"),
    };
    console.log(`\n📅 TuneDecode Schedule Builder`);
    console.log(`Songs available — Easy: ${byDiff.easy.length}, Medium: ${byDiff.medium.length}, Hard: ${byDiff.hard.length}, Viral: ${byDiff.viral.length}`);
    console.log(`Scheduling ${days} days starting ${start}\n`);
    // Check we have enough
    const minNeeded = Math.ceil(days / REUSE_WINDOW);
    for (const diff of ["easy", "medium", "hard", "viral"]) {
        const needed = diff === "medium" ? minNeeded * 2 : minNeeded;
        if (byDiff[diff].length < needed) {
            console.warn(`⚠️  Low on ${diff} songs (${byDiff[diff].length}). Consider generating more.`);
        }
    }
    // Load existing schedule
    let schedule = {};
    if (fs.existsSync(SCHEDULE_PATH)) {
        schedule = JSON.parse(fs.readFileSync(SCHEDULE_PATH, "utf-8"));
        console.log(`📋 Existing schedule: ${Object.keys(schedule).length} days`);
    }
    // Build a recent-use tracker from existing schedule
    const recentlyUsed = [];
    let added = 0;
    let skipped = 0;
    for (let i = 0; i < days; i++) {
        const dateStr = addDays(start, i);
        if (schedule[dateStr]) {
            skipped++;
            continue;
        }
        // Collect songs used in the last REUSE_WINDOW days
        const usedRecently = new Set();
        for (let back = 1; back <= REUSE_WINDOW; back++) {
            const pastDate = addDays(dateStr, -back);
            if (schedule[pastDate]) {
                schedule[pastDate].forEach((id) => usedRecently.add(id));
            }
        }
        const easy = pickOne(byDiff.easy, usedRecently);
        if (!easy) {
            console.warn(`⚠️  No easy song available for ${dateStr}`);
            continue;
        }
        usedRecently.add(easy.id);
        const medium1 = pickOne(byDiff.medium, usedRecently);
        if (!medium1) {
            console.warn(`⚠️  No medium song available for ${dateStr}`);
            continue;
        }
        usedRecently.add(medium1.id);
        const medium2 = pickOne(byDiff.medium, usedRecently);
        if (!medium2) {
            console.warn(`⚠️  No second medium song available for ${dateStr}`);
            continue;
        }
        usedRecently.add(medium2.id);
        const hard = pickOne(byDiff.hard, usedRecently);
        if (!hard) {
            console.warn(`⚠️  No hard song available for ${dateStr}`);
            continue;
        }
        usedRecently.add(hard.id);
        // Viral uses a shorter reuse window since the pool is smaller
        const viralUsedRecently = new Set();
        for (let back = 1; back <= VIRAL_REUSE_WINDOW; back++) {
            const pastDate = addDays(dateStr, -back);
            if (schedule[pastDate])
                viralUsedRecently.add(schedule[pastDate][4]);
        }
        const viral = pickOne(byDiff.viral, viralUsedRecently);
        if (!viral) {
            console.warn(`⚠️  No viral song available for ${dateStr}`);
            continue;
        }
        schedule[dateStr] = [easy.id, medium1.id, medium2.id, hard.id, viral.id];
        added++;
    }
    // Sort by date
    const sorted = Object.fromEntries(Object.entries(schedule).sort(([a], [b]) => a.localeCompare(b)));
    fs.mkdirSync(path.dirname(SCHEDULE_PATH), { recursive: true });
    fs.writeFileSync(SCHEDULE_PATH, JSON.stringify(sorted, null, 2));
    console.log(`✅ Added ${added} new days. Skipped ${skipped} already-scheduled days.`);
    console.log(`📦 Total scheduled: ${Object.keys(sorted).length} days`);
    console.log(`💾 Saved to data/schedule.json\n`);
}
main();
