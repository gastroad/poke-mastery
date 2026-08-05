import type { PokemonId, PokemonType } from "../pokemon/types";

/**
 * A bingo board is fully described by its two axes — every cell is just the
 * intersection of a row and a column, so there is nothing else to store.
 * Cells are indexed row-major: `index = row * size + col`.
 *
 *        불꽃  비행   물     ← columns: types
 *  1세대   0    1    2
 *  3세대   3    4    5
 *  5세대   6    7    8
 *    ↑ rows: generations
 */
export interface BingoBoard {
  size: number;
  /** One generation per row, top to bottom. */
  generations: number[];
  /** One type per column, left to right. */
  types: PokemonType[];
}

/** The (generation, type) pair a single cell demands. */
export interface BingoCell {
  index: number;
  generation: number;
  type: PokemonType;
}

/**
 * Board parameters. `minAnswersPerCell` is what keeps impossible or near-empty
 * cells off the board: 1세대 × 악 has zero answers (Dark only arrived in Gen 2),
 * and plenty of cells that ARE historically possible still have only one or two
 * (6세대 × 땅 is just 파르토). Both are excluded by the same threshold, which is
 * why there is no hardcoded "which types exist in which generation" table —
 * that table would let 6세대 × 땅 through and wrongly block 1세대 × 페어리
 * (삐삐·푸린 count today, since typings are judged as they stand now).
 */
export interface BingoRule {
  size: number;
  minAnswersPerCell: number;
  /** Placement attempts for the WHOLE board, not per cell. */
  attempts: number;
}

/**
 * What happened when the player dropped a name into a cell. Every failing case
 * carries the Pokémon it resolved to (when it resolved at all) so the UI can
 * explain the failure — "리자몽은 1세대 · 불꽃/비행" — instead of a bare ✗.
 */
export type Placement =
  | { kind: "placed"; pokemonId: PokemonId; generation: number; types: PokemonType[] }
  /** No Pokémon answers to that name. */
  | { kind: "unknown" }
  /** Already used elsewhere on this board — one Pokémon per board. */
  | { kind: "duplicate"; pokemonId: PokemonId; usedAtCell: number }
  /** Real Pokémon, wrong cell. */
  | { kind: "mismatch"; pokemonId: PokemonId; generation: number; types: PokemonType[] };
