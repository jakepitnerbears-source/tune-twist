// Deterministic shuffle so a given seed always produces the same order —
// randomness comes from the caller picking a fresh seed (e.g. Date.now() in a click handler),
// never from calling Math.random() here during render.
export function seededShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  let s = (seed + 1) >>> 0;
  for (let i = result.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
