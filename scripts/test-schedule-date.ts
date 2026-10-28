import { classifySchedule, dayIndexToDateString } from "../lib/scheduleDate";

let failures = 0;
function assert(condition: boolean, message: string) {
  if (!condition) {
    failures++;
    console.error("FAIL:", message);
  } else {
    console.log("ok  :", message);
  }
}

// dayIndexToDateString(0) is launch day — lock the exact value so a future edit to EPOCH_MS
// is a visible, deliberate change rather than a silent one.
assert(dayIndexToDateString(0) === "2026-04-13", "day index 0 maps to launch date 2026-04-13");
assert(dayIndexToDateString(1) === "2026-04-14", "day index 1 is the day after launch");

const schedule = [
  ["song-past"], // day 0 -> 2026-04-13
  ["song-today"], // day 1 -> 2026-04-14
  ["song-upcoming"], // day 2 -> 2026-04-15
];

const statuses = classifySchedule(schedule, "2026-04-14");

assert(statuses.get("song-past")?.status === "past", "a day before today is classified 'past'");
assert(statuses.get("song-today")?.status === "today", "today's day is classified 'today'");
assert(statuses.get("song-upcoming")?.status === "upcoming", "a future day is classified 'upcoming'");
assert(statuses.get("song-never-scheduled") === undefined, "a song absent from the schedule has no entry (caller treats as unscheduled)");

// A song appearing on both a past day and today (e.g. reused across days) should read "today" —
// "is it live right now" matters more than "has it ever been played before".
{
  const multiDaySchedule = [["reused-song"], ["reused-song"]];
  const multiStatuses = classifySchedule(multiDaySchedule, "2026-04-14");
  assert(multiStatuses.get("reused-song")?.status === "today", "a song scheduled both past and today reads as 'today'");
  assert(multiStatuses.get("reused-song")?.dates.length === 2, "all scheduled dates for a song are retained, not just one");
}

console.log(`\n${failures === 0 ? "ALL PASSED" : `${failures} FAILURE(S)`}`);
if (failures > 0) process.exit(1);
