// Small words to ignore when comparing
const IGNORE_WORDS = new Set(["the", "a", "an", "of", "in", "on", "at", "to", "and", "or"]);

const NUMBER_ONES: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11,
  twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
};
const NUMBER_TENS: Record<string, number> = {
  twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};

function collapseNumbers(str: string): string {
  let s = str.toLowerCase().replace(/-/g, " ");
  s = s.replace(
    /\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)\s+(one|two|three|four|five|six|seven|eight|nine)\b/g,
    (_, tens, ones) => String(NUMBER_TENS[tens] + NUMBER_ONES[ones])
  );
  s = s.replace(
    /\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)\b/g,
    (_, tens) => String(NUMBER_TENS[tens])
  );
  s = s.replace(
    /\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen)\b/g,
    (_, ones) => String(NUMBER_ONES[ones])
  );
  return s;
}

// Strip feat./remix/official suffixes so players don't have to type them
function stripSuffixes(title: string): string {
  return title
    .replace(/\s*\(feat\..*?\)/gi, "")
    .replace(/\s*\(ft\..*?\)/gi, "")
    .replace(/\s*\(with\s.*?\)/gi, "")
    .replace(/\s*\[.*?\]/g, "")
    .replace(/\s*-\s*(official|audio|video|lyric|remix|remaster).*$/gi, "")
    .trim();
}

// Map shorthand/slang tokens to their spoken equivalents
const SLANG: Record<string, string> = {
  u: "you",
  r: "are",
  ur: "your",
  b: "be",
  "4": "for",
  "2": "to",
  "2nite": "tonight",
  "2night": "tonight",
  luv: "love",
  dat: "that",
  dis: "this",
  wit: "with",
  wid: "with",
  ya: "you",
  yo: "you",
  n: "and",
  "4ever": "forever",
  bout: "about",
  cuz: "because",
  bc: "because",
};

function normalizeSlang(str: string): string {
  return str
    .split(/\s+/)
    .map((w) => SLANG[w] ?? w)
    .join(" ");
}

function normalize(str: string): string {
  return normalizeSlang(
    collapseNumbers(stripSuffixes(str))
      .replace(/[^a-z0-9\s]/g, "")
  )
    .split(/\s+/)
    .filter((w) => w.length > 0)
    .join(" ");
}

function tokenize(str: string): string[] {
  return normalize(str).split(" ");
}

// Levenshtein distance for typo tolerance
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function tokensSimilar(a: string, b: string): boolean {
  if (a === b) return true;
  // Allow 1 typo for words > 4 chars, 0 typos for short words
  const threshold = a.length > 4 ? 1 : 0;
  return levenshtein(a, b) <= threshold;
}

export function isAlmostCorrect(guess: string, correctTitle: string): boolean {
  if (validateGuess(guess, correctTitle)) return false;
  const guessTokens = tokenize(guess).filter((w) => !IGNORE_WORDS.has(w));
  const titleTokens = tokenize(correctTitle).filter((w) => !IGNORE_WORDS.has(w));
  if (guessTokens.length === 0) return false;
  const matchedTitleWords = new Set<number>();
  for (const gw of guessTokens) {
    for (let i = 0; i < titleTokens.length; i++) {
      if (!matchedTitleWords.has(i) && levenshtein(gw, titleTokens[i]) <= 2) {
        matchedTitleWords.add(i);
        break;
      }
    }
  }
  return matchedTitleWords.size / titleTokens.length >= 0.6;
}

export function validateGuess(guess: string, correctTitle: string): boolean {
  const guessTokens = tokenize(guess).filter((w) => !IGNORE_WORDS.has(w));
  const titleTokens = tokenize(correctTitle).filter((w) => !IGNORE_WORDS.has(w));

  if (guessTokens.length === 0) return false;

  // Every significant word in the guess must fuzzy-match a word in the title
  // AND we need to match at least half the title's significant words
  const matchedTitleWords = new Set<number>();

  for (const gw of guessTokens) {
    let matched = false;
    for (let i = 0; i < titleTokens.length; i++) {
      if (!matchedTitleWords.has(i) && tokensSimilar(gw, titleTokens[i])) {
        matchedTitleWords.add(i);
        matched = true;
        break;
      }
    }
    if (!matched) return false;
  }

  const coverage = matchedTitleWords.size / titleTokens.length;
  return coverage >= 0.5;
}
