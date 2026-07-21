import data from "@/data/pokemon.json";
import type { Pokemon } from "@/domain/pokemon/types";

/**
 * Static Gen-1 reference data, typed once for client use.
 * The JSON widens `types` to string[]; we assert back to the domain type here so
 * the rest of the client works with a proper `Pokemon[]`.
 */
export const POKEMON = data as Pokemon[];
