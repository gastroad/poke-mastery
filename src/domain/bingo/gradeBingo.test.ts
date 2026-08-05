import { describe, expect, it } from "vitest";
import type { Pokemon, PokemonType } from "../pokemon/types";
import { cellAnswers, cellsOf } from "./cellAnswers";
import { generateBingoBoard } from "./generateBoard";
import { gradeBingo, gradeBingoPlay } from "./gradeBingo";
import { MOCK_DEX } from "./testDataset";
import type { BingoBoard, BingoRule } from "./types";

const mon = (id: number, nameKo: string, generation: number, types: PokemonType[]): Pokemon => ({
  id,
  nameKo,
  nameEn: `m${id}`,
  generation,
  types,
  heightDm: 10,
  weightHg: 100,
  acceptedAnswers: [nameKo],
});

/**   불꽃    물     풀
 * 1  불하나  물하나  풀하나
 * 2  불둘   물둘   풀둘
 * 3  불셋   물셋   풀셋      */
const board: BingoBoard = { size: 3, generations: [1, 2, 3], types: ["fire", "water", "grass"] };
const dex: Pokemon[] = [
  mon(1, "불하나", 1, ["fire"]),
  mon(2, "물하나", 1, ["water"]),
  mon(3, "풀하나", 1, ["grass"]),
  mon(4, "불둘", 2, ["fire"]),
  mon(5, "물둘", 2, ["water"]),
  mon(6, "풀둘", 2, ["grass"]),
  mon(7, "불셋", 3, ["fire"]),
  mon(8, "물셋", 3, ["water"]),
  mon(9, "풀셋", 3, ["grass"]),
  // Qualifies for BOTH cell 0 (1세대 불꽃) and cell 1 (1세대 물).
  mon(10, "불물하나", 1, ["fire", "water"]),
];
const perfect = ["불하나", "물하나", "풀하나", "불둘", "물둘", "풀둘", "불셋", "물셋", "풀셋"];

describe("gradeBingo", () => {
  it("fills every cell of a perfect board and scores all 8 lines", () => {
    const graded = gradeBingo(board, perfect, dex);
    expect(graded.filledCount).toBe(9);
    expect(graded.lines).toHaveLength(8);
    expect(graded.placed).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it("leaves a cell empty when the Pokémon doesn't satisfy it", () => {
    const attempts = [...perfect];
    attempts[0] = "물하나"; // right generation, wrong type for cell 0
    const graded = gradeBingo(board, attempts, dex);
    expect(graded.placed[0]).toBeNull();
    expect(graded.filledCount).toBe(8);
  });

  it("never takes the client's word for a fill — an unknown name fills nothing", () => {
    const graded = gradeBingo(board, ["없는포켓몬", ...perfect.slice(1)], dex);
    expect(graded.placed[0]).toBeNull();
  });

  it("enforces one Pokémon per board: the earlier cell keeps it", () => {
    const attempts = [...perfect];
    attempts[0] = "불물하나";
    attempts[1] = "불물하나";
    const graded = gradeBingo(board, attempts, dex);
    expect(graded.placed[0]).toBe(10);
    expect(graded.placed[1]).toBeNull();
    expect(graded.filledCount).toBe(8);
  });

  it("lets the player spend a multi-cell Pokémon wherever they chose", () => {
    const attempts = [...perfect];
    attempts[1] = "불물하나"; // 1세대 물 instead of 물하나
    const graded = gradeBingo(board, attempts, dex);
    expect(graded.placed[1]).toBe(10);
  });

  it("treats missing and blank attempts as empty cells", () => {
    const graded = gradeBingo(board, ["불하나", ""], dex);
    expect(graded.filledCount).toBe(1);
    expect(graded.lines).toEqual([]);
  });

  it("reports one outcome per cell, so a half-finished board isn't 100% accuracy", () => {
    const graded = gradeBingo(board, ["불하나"], dex);
    expect(graded.outcome).toHaveLength(9);
    expect(graded.outcome.filter((o) => o.correct)).toHaveLength(1);
  });

  it("credits a filled cell with the Pokémon's types, and blames a miss on the column", () => {
    const graded = gradeBingo(board, ["불물하나"], dex);
    expect(graded.outcome[0]).toEqual({ types: ["fire", "water"], correct: true });
    expect(graded.outcome[1]).toEqual({ types: ["water"], correct: false }); // cell 1's column
  });

  it("scores a single row without claiming a bingo", () => {
    const graded = gradeBingo(board, ["불하나", "물하나", "풀하나"], dex);
    expect(graded.lines).toEqual([[0, 1, 2]]);
  });
});

describe("gradeBingoPlay", () => {
  const rule: BingoRule = { size: 3, minAnswersPerCell: 3, attempts: 13 };

  it("rebuilds the exact board from the seed and grades against it", () => {
    const seed = 20260804;
    const built = generateBingoBoard(rule, MOCK_DEX, seed)!;

    // Answer every cell, never reusing a Pokémon.
    const used = new Set<number>();
    const attempts = cellsOf(built).map((cell) => {
      const pick = cellAnswers(MOCK_DEX, cell.generation, cell.type).find((p) => !used.has(p.id));
      if (pick) used.add(pick.id);
      return pick?.nameKo ?? "";
    });

    const graded = gradeBingoPlay(rule, MOCK_DEX, seed, attempts);
    expect(graded?.board).toEqual(built);
    expect(graded?.filledCount).toBe(9);
    expect(graded?.lines).toHaveLength(8);
  });

  it("returns null when the board can't be rebuilt", () => {
    const gen1Only = MOCK_DEX.filter((p) => p.generation === 1);
    expect(gradeBingoPlay(rule, gen1Only, 1, [])).toBeNull();
  });
});
