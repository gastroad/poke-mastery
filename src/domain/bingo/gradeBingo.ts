import type { Dataset } from "../challenge/types";
import type { PokemonId } from "../pokemon/types";
import type { OutcomeItem, PlayOutcome } from "../progress/types";
import { cellsOf } from "./cellAnswers";
import { generateBingoBoard } from "./generateBoard";
import { completedLines } from "./lines";
import { judgePlacement } from "./placement";
import type { BingoBoard, BingoRule } from "./types";

export interface GradedBingo {
  board: BingoBoard;
  /** What ended up in each cell, by index (null = empty or rejected). */
  placed: (PokemonId | null)[];
  filledCount: number;
  /** Completed lines as cell indices. */
  lines: number[][];
  /** One entry per CELL, so progress/mastery sees the misses too. */
  outcome: PlayOutcome;
}

/**
 * Re-judge a finished board from the raw inputs.
 *
 * `attempts[i]` is what the player put in cell `i` ("" or missing = left empty),
 * so the player's placement choice is carried by the array index alone — which
 * is why a bingo game still fits the existing `PlayRecord` with no schema
 * change. Cells are re-judged in index order and anything illegal (unknown name,
 * wrong cell, a Pokémon already used earlier) simply stays empty; the server
 * never takes the client's word for a fill.
 *
 * Note this only re-derives the OUTCOME. Attempts spent on failures are not in
 * the record and are not reconstructible — they are the in-game pressure, not
 * part of the score.
 */
export function gradeBingo(
  board: BingoBoard,
  attempts: readonly string[],
  dataset: Dataset,
): GradedBingo {
  const cells = cellsOf(board);
  const placed: (PokemonId | null)[] = cells.map(() => null);
  const outcome: OutcomeItem[] = [];

  for (const cell of cells) {
    const result = judgePlacement(cell, attempts[cell.index] ?? "", dataset, placed);
    if (result.kind === "placed") {
      placed[cell.index] = result.pokemonId;
      outcome.push({ types: result.types, correct: true });
    } else {
      // An unfilled cell still counts as exposure to its column's type, so a
      // board you half-finish doesn't read as flawless accuracy.
      outcome.push({ types: [cell.type], correct: false });
    }
  }

  const filled = placed.map((id) => id !== null);
  return {
    board,
    placed,
    filledCount: filled.filter(Boolean).length,
    lines: completedLines(board.size, filled),
    outcome,
  };
}

/**
 * Server-side entry point: rebuild the exact board from the seed, then grade.
 * Returns null when the board can't be rebuilt (dataset too small for the rule).
 */
export function gradeBingoPlay(
  rule: BingoRule,
  dataset: Dataset,
  seed: number,
  attempts: readonly string[],
): GradedBingo | null {
  const board = generateBingoBoard(rule, dataset, seed);
  return board ? gradeBingo(board, attempts, dataset) : null;
}
