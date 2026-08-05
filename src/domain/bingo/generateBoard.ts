import type { Dataset } from "../challenge/types";
import type { PokemonType } from "../pokemon/types";
import { createRng } from "../rng/createRng";
import { shuffle } from "../rng/shuffle";
import { countMatrix } from "./cellAnswers";
import type { BingoBoard, BingoRule } from "./types";

/** Every `k`-sized subset of `items`, in index order (deterministic). */
function* combinations<T>(items: readonly T[], k: number, start = 0): Generator<T[]> {
  if (k === 0) {
    yield [];
    return;
  }
  for (let i = start; i <= items.length - k; i++) {
    for (const rest of combinations(items, k - 1, i + 1)) yield [items[i], ...rest];
  }
}

/**
 * Pick the two axes for one board.
 *
 * DETERMINISTIC: same rule + dataset + seed ⇒ identical board, so the server can
 * rebuild the player's board from the seed alone and re-judge every placement.
 *
 * Every cell is guaranteed to have at least `minAnswersPerCell` valid answers —
 * that single rule is what keeps unplayable cells off the board (see BingoRule).
 *
 * The search shuffles both axes with the seeded RNG, then walks generation
 * subsets in that shuffled order. For a given set of generations, a type is
 * usable when it clears the threshold against EVERY one of them; since that test
 * is independent per type, any `size` usable types complete a valid board. So the
 * first subset with enough usable types wins, and the walk is exhaustive —
 * if a valid board exists at all, this finds one.
 *
 * Returns null when the dataset simply cannot fill a board of this size (e.g.
 * a Gen 1–only dataset, which has a single generation to draw rows from).
 */
export function generateBingoBoard(
  rule: BingoRule,
  dataset: Dataset,
  seed: number,
): BingoBoard | null {
  const { size } = rule;
  if (!Number.isInteger(size) || size < 1) return null;
  // A cell with zero answers is unplayable, so the floor is 1 regardless of rule.
  const min = Math.max(1, rule.minAnswersPerCell);

  const matrix = countMatrix(dataset);
  const rng = createRng(seed);

  const generations = shuffle([...matrix.keys()], rng);
  if (generations.length < size) return null;

  const allTypes = new Set<PokemonType>();
  for (const row of matrix.values()) for (const t of row.keys()) allTypes.add(t);
  const types = shuffle([...allTypes], rng);
  if (types.length < size) return null;

  for (const gens of combinations(generations, size)) {
    const usable = types.filter((t) => gens.every((g) => (matrix.get(g)?.get(t) ?? 0) >= min));
    if (usable.length >= size) {
      return {
        size,
        // Rows read top-to-bottom as 1세대 → 9세대; WHICH generations appear is
        // random, the order they're shown in is not.
        generations: [...gens].sort((a, b) => a - b),
        types: usable.slice(0, size),
      };
    }
  }
  return null;
}
