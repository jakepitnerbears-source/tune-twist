import path from "path";
import fs from "fs";
import SongsTable from "@/components/SongsTable";

type RawSong = {
  id: string;
  title: string;
  artist: string;
  synonymTitle: string;
  genre: string;
  releaseYear: string;
  hints?: string[];
};

type Schedule = [string, string, string, string, string][];

const EPOCH_MS = new Date("2026-04-13T12:00:00").getTime();

function dayIndexToDateString(dayIndex: number): string {
  const ms = EPOCH_MS + dayIndex * 86_400_000;
  const d = new Date(ms);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export const revalidate = 3600;

export default function SongsPage() {
  const songsPath = path.join(process.cwd(), "data/songs.json");
  const schedulePath = path.join(process.cwd(), "data/schedule.json");

  const songs: RawSong[] = JSON.parse(fs.readFileSync(songsPath, "utf-8"));
  const schedule: Schedule = JSON.parse(fs.readFileSync(schedulePath, "utf-8"));

  // Build map: songId -> scheduledDate string
  const scheduledDateMap = new Map<string, string>();
  for (let dayIndex = 0; dayIndex < schedule.length; dayIndex++) {
    const ids = schedule[dayIndex];
    const dateStr = dayIndexToDateString(dayIndex);
    for (const id of ids) {
      if (!scheduledDateMap.has(id)) {
        scheduledDateMap.set(id, dateStr);
      }
    }
  }

  const rows = songs.map((s) => {
    const syn = (s.synonymTitle ?? "").trim().toLowerCase();
    const hint0 = (s.hints?.[0] ?? "").trim().toLowerCase();
    return {
      id: s.id,
      title: s.title,
      artist: s.artist,
      synonymTitle: s.synonymTitle ?? "",
      genre: s.genre ?? "",
      releaseYear: s.releaseYear ?? "",
      scheduledDate: scheduledDateMap.get(s.id) ?? "—",
      noSecondaryHint: !hint0 || hint0 === syn,
    };
  });

  rows.sort((a, b) => {
    const aScheduled = a.scheduledDate !== "—";
    const bScheduled = b.scheduledDate !== "—";
    if (aScheduled && bScheduled) return a.scheduledDate.localeCompare(b.scheduledDate);
    if (aScheduled) return -1;
    if (bScheduled) return 1;
    return 0;
  });

  return (
    <main className="px-6 pt-20 pb-16">
      <SongsTable rows={rows} />
    </main>
  );
}
