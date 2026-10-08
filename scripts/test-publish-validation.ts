import { mergeRecord, validateDailyPublish, validateQuizPublish } from "../lib/quiz/publishValidation";
import type { QuizSong, QuizPackConfig } from "../lib/quiz/types";
import type { Song } from "../data/puzzles";

let failures = 0;
function assert(condition: boolean, message: string) {
  if (!condition) {
    failures++;
    console.error("FAIL:", message);
  } else {
    console.log("ok  :", message);
  }
}

// mergeRecord
{
  const existing = { id: "a", synonymTitle: "Old", hints: ["h1", "h2"] };
  const merged = mergeRecord(existing, { synonymTitle: "New" });
  assert(merged.synonymTitle === "New", "mergeRecord overwrites the patched field");
  assert(JSON.stringify(merged.hints) === JSON.stringify(["h1", "h2"]), "mergeRecord preserves untouched fields");
  assert(merged.id === "a", "mergeRecord preserves id");

  const created = mergeRecord(undefined, { id: "new", synonymTitle: "Brand New" });
  assert(created.id === "new", "mergeRecord with no existing record builds from the patch alone (new record case)");
}

// validateDailyPublish
{
  assert(validateDailyPublish({ synonymTitle: "Valid Title", hints: ["h1", "h2"] }).ok, "valid daily patch passes");
  assert(!validateDailyPublish({ synonymTitle: "" }).ok, "empty synonym title is rejected");
  assert(!validateDailyPublish({ synonymTitle: "   " }).ok, "whitespace-only synonym title is rejected");
  assert(!validateDailyPublish({ synonymTitle: "Fine", hints: ["only one"] as unknown as [string, string] }).ok, "wrong hint count is rejected");
  assert(!validateDailyPublish({ synonymTitle: "Fine", hints: ["", "also empty"] as [string, string] }).ok, "an empty hint string is rejected");
  assert(validateDailyPublish({ synonymTitle: "Fine" }).ok, "omitting hints entirely is allowed (synonym-only edit)");
}

// validateQuizPublish
function song(overrides: Partial<QuizSong>): QuizSong {
  return {
    id: "base",
    title: "Base Title",
    artist: "Base Artist",
    releaseYear: "2000",
    synonymTitle: "Base Twist",
    hints: ["h1", "h2"],
    quizzes: ["pack-a"],
    reviewStatus: "published",
    ...overrides,
  };
}
const packs: QuizPackConfig[] = [{ slug: "pack-a", kind: "artist", heading: "", title: "", description: "", intro: "" }];

{
  const valid = [song({ id: "a" })];
  assert(validateQuizPublish(valid, [], packs).ok, "a valid candidate quiz catalog passes");

  const duplicateIds = [song({ id: "a" }), song({ id: "a", title: "Different" })];
  const dupCheck = validateQuizPublish(duplicateIds, [], packs);
  assert(!dupCheck.ok, "a candidate catalog with a duplicate id is rejected before commit");

  const missingField = [song({ id: "a", synonymTitle: "" })];
  assert(!validateQuizPublish(missingField, [], packs).ok, "a candidate catalog missing a required field is rejected before commit");

  // Overlap with daily is allowed — must not block publish.
  const daily: Song[] = [{ id: "d1", title: "Base Title", artist: "Base Artist", releaseYear: "1999", synonymTitle: "x", hints: ["x", "y"] }];
  assert(validateQuizPublish(valid, daily, packs).ok, "daily/quiz overlap does not block publish");
}

console.log(`\n${failures === 0 ? "ALL PASSED" : `${failures} FAILURE(S)`}`);
if (failures > 0) process.exit(1);
