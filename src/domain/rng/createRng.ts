/**
 * Deterministic seeded PRNG (mulberry32).
 *
 * WHY not Math.random(): the whole game must be reproducible from a single
 * `seed`. The client plays with a seed; later the server re-runs the exact same
 * generation from that seed to recompute the result. Same seed ⇒ same sequence,
 * on any machine. That is impossible with Math.random().
 *
 * Returns a function that yields the next float in [0, 1) each call.
 */
export function createRng(seed: number): () => number {
  let a = seed >>> 0; // coerce to uint32
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
