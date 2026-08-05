import type { Pokemon, PokemonId, PokemonType } from "../pokemon/types";

/**
 * Session format:
 * - "quiz": fixed number of questions, lives, answer→reveal→next.
 * - "time-attack": one global countdown, answer as many as possible.
 * - "reveal-rush": each silhouette reveals over time; earlier guess = more points.
 * - "bingo": a generation × type grid to fill from memory — no silhouette, and
 *   the questions aren't a list (see domain/bingo).
 * - "gender": male or female, from the sprites of a species that looks different
 *   by gender (see generateGenderQuestions).
 * - "heavier": two Pokémon, pick the heavier one (see generateHeavierQuestions).
 */
export type GameMode = "quiz" | "time-attack" | "reveal-rush" | "bingo" | "gender" | "heavier";

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
  /** Reveal-rush only: seconds each silhouette takes to fully reveal. */
  revealSec?: number;
  /** Bingo only: board edge (3 ⇒ 3×3). */
  boardSize?: number;
  /** Bingo only: a cell is only used if this many Pokémon can fill it. */
  minAnswersPerCell?: number;
  /** Bingo only: placement attempts for the whole board. */
  attempts?: number;
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
  /** Gender quiz only: which gender's sprites to show. The answer is the gender. */
  gender?: "male" | "female";
  /** Comparison quiz only: the second Pokémon. `pokemonId` is the left-hand one. */
  pairId?: PokemonId;
}

/** Convenience alias: the reference dataset passed into pure generators. */
export type Dataset = readonly Pokemon[];
