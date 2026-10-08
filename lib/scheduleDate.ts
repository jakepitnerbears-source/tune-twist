import path from "path";
import fs from "fs";

// Matches the EPOCH_MS already duplicated across app/admin/page.tsx, app/admin/schedule/page.tsx,
// app/admin/song-library/page.tsx, and app/admin/preview/page.tsx — day index 0 is launch day.
const EPOCH_MS = new Date("2026-04-13T12:00:00").getTime();

export function dayIndexToDateString(dayIndex: number): string {
  const ms = EPOCH_MS + dayIndex * 86_400_000;
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export type DailyScheduleStatus = "unscheduled" | "past" | "today" | "upcoming";

export interface DailyScheduleInfo {
  status: DailyScheduleStatus;
  dates: string[];
}

function loadSchedule(): string[][] {
  try {
    const jsonPath = path.join(process.cwd(), "data/schedule.json");
    return JSON.parse(fs.readFileSync(jsonPath, "utf-8")) as string[][];
  } catch {
    return [];
  }
}

/** Pure — testable without touching the filesystem or the real clock. */
export function classifySchedule(schedule: string[][], today: string): Map<string, DailyScheduleInfo> {
  const byId = new Map<string, string[]>();

  schedule.forEach((ids, dayIndex) => {
    const date = dayIndexToDateString(dayIndex);
    ids.forEach((id) => {
      byId.set(id, [...(byId.get(id) ?? []), date]);
    });
  });

  const result = new Map<string, DailyScheduleInfo>();
  for (const [id, dates] of byId) {
    const hasToday = dates.includes(today);
    const hasPast = dates.some((d) => d < today);
    const hasUpcoming = dates.some((d) => d > today);
    const status: DailyScheduleStatus = hasToday ? "today" : hasPast ? "past" : hasUpcoming ? "upcoming" : "unscheduled";
    result.set(id, { status, dates });
  }
  return result;
}

/** Where (if anywhere) each daily song id is scheduled, classified against today's date. */
export function getDailyScheduleStatuses(): Map<string, DailyScheduleInfo> {
  const schedule = loadSchedule();
  const today = new Date().toISOString().split("T")[0];
  return classifySchedule(schedule, today);
}
