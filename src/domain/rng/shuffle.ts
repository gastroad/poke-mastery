/**
 * Fisher–Yates shuffle driven by an injected RNG (see createRng).
 *
 * Pure: does not mutate the input and does not read global randomness — the
 * randomness comes only from `rng`, so a seeded rng makes the shuffle
 * reproducible.
 */
export function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
