import { loadScheduleAndLibrary } from "@/lib/getDailyPuzzle";
import LibraryTable from "./LibraryTable";

export const revalidate = 3600;

export default function LibraryPage() {
  const { library } = loadScheduleAndLibrary();
  return (
    <main className="px-6 pt-10 pb-16">
      <LibraryTable songs={library} />
    </main>
  );
}
