import type { Dataset } from "../challenge/types";
import type { Pokemon, PokemonType } from "../pokemon/types";
import type { BingoBoard, BingoCell } from "./types";

/** Does this Pokémon satisfy a (generation, type) cell? */
export function satisfies(pokemon: Pokemon, generation: number, type: PokemonType): boolean {
  return pokemon.generation === generation && pokemon.types.includes(type);
}

/** Every Pokémon that could legally fill this cell. */
export function cellAnswers(
  dataset: Dataset,
  generation: number,
  type: PokemonType,
): readonly Pokemon[] {
  return dataset.filter((p) => satisfies(p, generation, type));
}

/** The (generation, type) pair a cell index demands. */
export function cellAt(board: BingoBoard, index: number): BingoCell | null {
  if (!Number.isInteger(index) || index < 0 || index >= board.size * board.size) return null;
  const row = Math.floor(index / board.size);
  const col = index % board.size;
  return { index, generation: board.generations[row], type: board.types[col] };
}

/** All cells, row-major. */
export function cellsOf(board: BingoBoard): BingoCell[] {
  const cells: BingoCell[] = [];
  for (let row = 0; row < board.size; row++) {
    for (let col = 0; col < board.size; col++) {
      cells.push({
        index: row * board.size + col,
        generation: board.generations[row],
        type: board.types[col],
      });
    }
  }
  return cells;
}

/**
 * How many Pokémon satisfy each (generation, type) pair in the dataset.
 * Built once and reused while searching for a board, since the search asks the
 * same question thousands of times.
 */
export function countMatrix(dataset: Dataset): Map<number, Map<PokemonType, number>> {
  const matrix = new Map<number, Map<PokemonType, number>>();
  for (const p of dataset) {
    let row = matrix.get(p.generation);
    if (!row) {
      row = new Map();
      matrix.set(p.generation, row);
    }
    // A dual-type Pokémon counts once for each of its types, and `types` never
    // repeats a type, so no de-duplication is needed here.
    for (const t of p.types) row.set(t, (row.get(t) ?? 0) + 1);
  }
  return matrix;
}
