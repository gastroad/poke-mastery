import type { Pokemon, PokemonId, PokemonType } from "../pokemon/types";

/**
 * Session format (always "guess the name by silhouette" for now):
 * - "quiz": fixed number of questions, lives, answer→reveal→next.
 * - "time-attack": one global countdown, answer as many as possible.
 */
export type GameMode = "quiz" | "time-attack";

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
  /** How many questions to generate. For time-attack, set to the pool size (endless within the clock). */
  questionCount: number;
  /** Time-attack only: total seconds on the clock. */
  timeLimitSec?: number;
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
