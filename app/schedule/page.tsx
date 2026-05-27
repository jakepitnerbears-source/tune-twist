import path from "path";
import fs from "fs";
import ScheduleDashboard from "@/components/ScheduleDashboard";

type RawSong = {
  id: string;
  title: string;
  artist: string;
  synonymTitle: string;
  genre: string;
  releaseYear: string;
};

type Schedule = string[][];

const EPOCH_MS = new Date("2026-04-13T12:00:00").getTime();

function dayIndexToDateString(dayIndex: number): string {
  const ms = EPOCH_MS + dayIndex * 86_400_000;
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export const revalidate = 3600;

export default function SchedulePage() {
  const songsPath = path.join(process.cwd(), "data/songs.json");
  const schedulePath = path.join(process.cwd(), "data/schedule.json");
  const newSongsPath = path.join(process.cwd(), "data/new.songs.json");

  const songs: RawSong[] = JSON.parse(fs.readFileSync(songsPath, "utf-8"));
  const schedule: Schedule = JSON.parse(fs.readFileSync(schedulePath, "utf-8"));
  let newSongs: RawSong[] = [];
  try { newSongs = JSON.parse(fs.readFileSync(newSongsPath, "utf-8")); } catch { newSongs = []; }

  const songMap = new Map(songs.map((s) => [s.id, s]));

  const days = schedule.map((ids, i) => ({
    dayIndex: i,
    date: dayIndexToDateString(i),
    songs: ids.map((id) => {
      const s = songMap.get(id);
      return {
        id,
        title: s?.title ?? id,
        artist: s?.artist ?? "?",
        synonymTitle: s?.synonymTitle ?? "",
        genre: s?.genre ?? "Unknown",
        releaseYear: s?.releaseYear ?? "",
      };
    }),
  }));

  return (
    <main className="px-4 md:px-6 pt-20 pb-16">
      <ScheduleDashboard days={days} newSongs={newSongs} />
    </main>
  );
}
