import { loadQuizCatalog, loadQuizPacks, loadDailyCatalog } from "../lib/quiz/catalog";
import { validateQuizCatalog } from "../lib/quiz/validate";

const quizCatalog = loadQuizCatalog();
const packs = loadQuizPacks();
const daily = loadDailyCatalog();

const report = validateQuizCatalog(quizCatalog, daily, packs);

console.log("ERRORS:", report.errors.length);
report.errors.forEach((e) => console.log("  -", e.code, e.message));
console.log("WARNINGS:", report.warnings.length);
report.warnings.forEach((w) => console.log("  -", w.code, w.message));
console.log("INFO:", report.info.length);
report.info.forEach((i) => console.log("  -", i.code, i.message));

console.log("\nTotal quiz songs:", quizCatalog.length);
console.log("Daily songs loaded:", daily.length);

if (report.errors.length > 0) process.exit(1);
