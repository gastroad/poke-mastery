import type { PokemonType } from "../pokemon/types";

/** Cumulative exposure + accuracy for one Pokémon type. Mastery% is derived from this. */
export interface TypeStat {
  seen: number;
  correct: number;
}

/**
 * A player's persisted progress — the single source of truth.
 * `totalXp` drives level (derived, not stored here); `typeStats` drives per-type
 * mastery. Everything else (level, mastery%, unlocks) is computed from these.
 */
export interface Progress {
  totalXp: number;
  typeStats: Partial<Record<PokemonType, TypeStat>>;
}

/** One graded question the player faced. Order matters (combo scoring). */
export interface OutcomeItem {
  types: PokemonType[];
  correct: boolean;
}

/** The graded result of one finished game, rebuilt from a PlayRecord on the server. */
export type PlayOutcome = readonly OutcomeItem[];

/** What changed from applying one play — drives the end-of-game celebration. */
export interface ProgressDelta {
  score: number;
  xpGained: number;
  levelBefore: number;
  levelAfter: number;
  leveledUp: boolean;
}
