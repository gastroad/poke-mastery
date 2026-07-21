import "server-only";
import data from "@/data/pokemon.json";
import type { Pokemon } from "@/domain/pokemon/types";

/** Static Gen-1 reference data for server-side re-grading (mirror of the client loader). */
export const POKEMON = data as Pokemon[];
