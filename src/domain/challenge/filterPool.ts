import type { Dataset, PoolFilter } from "./types";
import type { Pokemon } from "../pokemon/types";

/**
 * Narrow the dataset down to the Pokémon a challenge may ask about.
 *
 * Order-preserving and pure, so `filterPool` + a seeded shuffle stay
 * deterministic. An empty/omitted filter returns everything (in input order).
 */
export function filterPool(dataset: Dataset, filter: PoolFilter): Pokemon[] {
  const { generations, types } = filter;
  return dataset.filter((p) => {
    if (generations && generations.length > 0 && !generations.includes(p.generation)) {
      return false;
    }
    if (types && types.length > 0 && !p.types.some((t) => types.includes(t))) {
      return false;
    }
    return true;
  });
}
