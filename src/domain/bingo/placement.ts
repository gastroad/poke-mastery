import { judgeAnswer } from "../answer/judgeAnswer";
import type { Dataset } from "../challenge/types";
import type { Pokemon, PokemonId } from "../pokemon/types";
import { satisfies } from "./cellAnswers";
import type { BingoCell, Placement } from "./types";

/** The Pokémon that answers to this name, or null if none does. */
export function findByAnswer(dataset: Dataset, input: string): Pokemon | null {
  return dataset.find((p) => judgeAnswer(input, p.acceptedAnswers)) ?? null;
}

/**
 * Judge dropping a name into one cell.
 *
 * Placement is FREE: the player may aim at any cell, and the board never hints
 * which cells would accept the Pokémon. Landing on the wrong cell is a real
 * failure (it costs an attempt) — so knowing the name is not enough, you have to
 * know its generation and typing too. Every failure carries the Pokémon it
 * resolved to, so the UI can say exactly why it bounced.
 *
 * `placed` is the board's current contents, indexed by cell (null = empty); it
 * is what enforces one-Pokémon-per-board.
 */
export function judgePlacement(
  cell: BingoCell,
  input: string,
  dataset: Dataset,
  placed: readonly (PokemonId | null)[],
): Placement {
  const pokemon = findByAnswer(dataset, input);
  if (!pokemon) return { kind: "unknown" };

  const usedAtCell = placed.findIndex((id, i) => id === pokemon.id && i !== cell.index);
  if (usedAtCell !== -1) return { kind: "duplicate", pokemonId: pokemon.id, usedAtCell };

  const detail = { pokemonId: pokemon.id, generation: pokemon.generation, types: pokemon.types };
  return satisfies(pokemon, cell.generation, cell.type)
    ? { kind: "placed", ...detail }
    : { kind: "mismatch", ...detail };
}
