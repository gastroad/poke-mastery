import type { Pokemon, PokemonId, PokemonType } from "../pokemon/types";

/** Game modes. MVP ships only "name-guess" (see a sprite, type the name). */
export type GameMode = "name-guess";

/**
 * Which Pokémon a challenge draws from. Undefined field = no constraint.
 * `generations`: keep only these generations. `types`: keep Pokémon having at
 * least one of these types.
 */
export interface PoolFilter {
  generations?: number[];
  types?: PokemonType[];
}

/**
 * The pure definition of a challenge. Combined with a `seed`, it fully
 * determines the question set — so the server can replay it (see generateQuestions).
 */
export interface ChallengeRule {
  mode: GameMode;
  pool: PoolFilter;
  questionCount: number;
}

/**
 * One generated question. Presentation (which sprite variant, silhouette on/off)
 * is intentionally NOT here — the client decides how to render `pokemonId`.
 */
export interface Question {
  pokemonId: PokemonId;
  /** Display name to reveal after answering (nameKo). */
  answer: string;
  /** Pre-normalized strings accepted as correct (for instant client-side judging). */
  acceptedAnswers: string[];
}

/** Convenience alias: the reference dataset passed into pure generators. */
export type Dataset = readonly Pokemon[];
