import { validateQuizCatalog } from "../lib/quiz/validate";
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

function song(overrides: Partial<QuizSong>): QuizSong {
  return {
    id: "base-id",
    title: "Base Title",
    artist: "Base Artist",
    releaseYear: "2000",
    synonymTitle: "Base Twist",
    hints: ["Released in 2000", "Artist: Base Artist"],
    quizzes: ["test-pack"],
    reviewStatus: "published",
    ...overrides,
  };
}

const packs: QuizPackConfig[] = [
  { slug: "test-pack", kind: "artist", heading: "", title: "", description: "", intro: "" },
];

// 1. Clean catalog — zero errors/warnings.
{
  const catalog = [song({ id: "a" }), song({ id: "b", title: "Other Title", artist: "Other Artist", synonymTitle: "Other Twist" })];
  const report = validateQuizCatalog(catalog, [], packs);
  assert(report.errors.length === 0, "clean catalog has no errors");
  assert(report.warnings.length === 0, "clean catalog has no warnings");
}

// 2. Missing required field.
{
  const catalog = [song({ id: "a", title: "" })];
  const report = validateQuizCatalog(catalog, [], packs);
  assert(report.errors.some((e) => e.code === "missing-field"), "missing title is flagged");
}

// 3. Wrong hint count.
{
  const catalog = [song({ id: "a", hints: ["only one"] as unknown as [string, string] })];
  const report = validateQuizCatalog(catalog, [], packs);
  assert(report.errors.some((e) => e.code === "invalid-hints"), "wrong hint count is flagged");
}

// 4. Song with no quiz assignment.
{
  const catalog = [song({ id: "a", quizzes: [] })];
  const report = validateQuizCatalog(catalog, [], packs);
  assert(report.errors.some((e) => e.code === "unassigned-song"), "unassigned song is flagged");
}

// 5. Duplicate ID.
{
  const catalog = [song({ id: "dup", title: "First" }), song({ id: "dup", title: "Second" })];
  const report = validateQuizCatalog(catalog, [], packs);
  assert(report.errors.some((e) => e.code === "duplicate-id"), "duplicate id is flagged");
}

// 6. Duplicate identity (same title+artist, different ids) within quiz catalog.
{
  const catalog = [song({ id: "a", title: "Same Song", artist: "Same Artist" }), song({ id: "b", title: "Same Song", artist: "Same Artist" })];
  const report = validateQuizCatalog(catalog, [], packs);
  assert(report.errors.some((e) => e.code === "duplicate-identity-in-quiz-catalog"), "duplicate identity within quiz catalog is flagged");
}

// 7. Overlap with daily catalog — info, not error/warning, and never blocking.
{
  const catalog = [song({ id: "a", title: "Shared Song", artist: "Shared Artist" })];
  const daily: Song[] = [
    { id: "d1", title: "Shared Song", artist: "Shared Artist", releaseYear: "1999", synonymTitle: "x", hints: ["x", "y"] },
  ];
  const report = validateQuizCatalog(catalog, daily, packs);
  assert(report.errors.length === 0, "daily/quiz overlap never produces an error");
  assert(report.info.some((i) => i.code === "daily-quiz-overlap"), "daily/quiz overlap is reported as info");
}

// 8. Repeated synonym twist across two different real songs.
{
  const catalog = [
    song({ id: "a", title: "Song A", artist: "Artist A", synonymTitle: "Same Disguise" }),
    song({ id: "b", title: "Song B", artist: "Artist B", synonymTitle: "Same Disguise" }),
  ];
  const report = validateQuizCatalog(catalog, [], packs);
  assert(report.warnings.some((w) => w.code === "repeated-twist"), "repeated synonym twist is flagged as a warning");
}

// 9. Empty pack.
{
  const catalog = [song({ id: "a", quizzes: ["other-pack"] })];
  const report = validateQuizCatalog(catalog, [], packs);
  assert(report.warnings.some((w) => w.code === "empty-pack"), "pack with zero published songs is flagged");
}

// 10. Cross-pack assignment is reported, not blocked.
{
  const multiPacks: QuizPackConfig[] = [
    { slug: "test-pack", kind: "artist", heading: "", title: "", description: "", intro: "" },
    { slug: "second-pack", kind: "decade", heading: "", title: "", description: "", intro: "" },
  ];
  const catalog = [song({ id: "a", quizzes: ["test-pack", "second-pack"] })];
  const report = validateQuizCatalog(catalog, [], multiPacks);
  assert(report.errors.length === 0, "cross-pack assignment is allowed");
  assert(report.info.some((i) => i.code === "cross-pack-assignment"), "cross-pack assignment is reported");
}

console.log(`\n${failures === 0 ? "ALL PASSED" : `${failures} FAILURE(S)`}`);
if (failures > 0) process.exit(1);
