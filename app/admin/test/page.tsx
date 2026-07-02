import { loadScheduleAndLibrary } from "@/lib/getDailyPuzzle";
import TestBuilder from "./TestBuilder";

export const dynamic = "force-dynamic";

export default function AdminTestPage() {
  const { library } = loadScheduleAndLibrary();
  const songs = library.map((s) => ({ id: s.id, title: s.title, artist: s.artist }));
  return (
    <main className="flex flex-col items-center px-6 pt-12 pb-16">
      <TestBuilder songs={songs} />
    </main>
  );
}
