import { describe, expect, it } from "vitest";
import { countMatrix } from "./cellAnswers";
import { generateBingoBoard } from "./generateBoard";
import { buildDataset, MOCK_DEX } from "./testDataset";
import type { BingoBoard, BingoRule } from "./types";

const rule: BingoRule = { size: 3, minAnswersPerCell: 3, attempts: 13 };
const seeds = Array.from({ length: 200 }, (_, i) => i * 7 + 1);

/** The smallest count across every cell of a board. */
function thinnestCell(board: BingoBoard, dataset = MOCK_DEX): number {
  const matrix = countMatrix(dataset);
  let min = Infinity;
  for (const g of board.generations) {
    for (const t of board.types) min = Math.min(min, matrix.get(g)?.get(t) ?? 0);
  }
  return min;
}

describe("generateBingoBoard", () => {
  it("is deterministic: same seed produces an identical board", () => {
    expect(generateBingoBoard(rule, MOCK_DEX, 4242)).toEqual(
      generateBingoBoard(rule, MOCK_DEX, 4242),
    );
  });

  it("different seeds produce different boards", () => {
    const boards = seeds.slice(0, 30).map((s) => JSON.stringify(generateBingoBoard(rule, MOCK_DEX, s)));
    expect(new Set(boards).size).toBeGreaterThan(1);
  });

  it("every cell of every board clears minAnswersPerCell", () => {
    for (const seed of seeds) {
      const board = generateBingoBoard(rule, MOCK_DEX, seed);
      expect(board).not.toBeNull();
      expect(thinnestCell(board!)).toBeGreaterThanOrEqual(rule.minAnswersPerCell);
    }
  });

  it("never pairs gen 1 with dark — that cell has no answers at all", () => {
    for (const seed of seeds) {
      const board = generateBingoBoard(rule, MOCK_DEX, seed)!;
      expect(board.generations.includes(1) && board.types.includes("dark")).toBe(false);
    }
  });

  it("excludes thin cells that ARE historically possible (gen 1 ice, only 2)", () => {
    for (const seed of seeds) {
      const board = generateBingoBoard(rule, MOCK_DEX, seed)!;
      expect(board.generations.includes(1) && board.types.includes("ice")).toBe(false);
    }
  });

  it("a lower threshold lets those thin cells back in", () => {
    const loose: BingoRule = { ...rule, minAnswersPerCell: 1 };
    const anyThin = seeds.some((seed) => {
      const board = generateBingoBoard(loose, MOCK_DEX, seed)!;
      return board.generations.includes(1) && board.types.includes("ice");
    });
    expect(anyThin).toBe(true);
  });

  it("still refuses the zero-answer cell even at the lowest threshold", () => {
    const loose: BingoRule = { ...rule, minAnswersPerCell: 0 };
    for (const seed of seeds) {
      const board = generateBingoBoard(loose, MOCK_DEX, seed)!;
      expect(board.generations.includes(1) && board.types.includes("dark")).toBe(false);
    }
  });

  it("uses each generation and each type at most once", () => {
    for (const seed of seeds.slice(0, 50)) {
      const board = generateBingoBoard(rule, MOCK_DEX, seed)!;
      expect(new Set(board.generations).size).toBe(rule.size);
      expect(new Set(board.types).size).toBe(rule.size);
    }
  });

  it("orders rows by generation ascending", () => {
    for (const seed of seeds.slice(0, 50)) {
      const { generations } = generateBingoBoard(rule, MOCK_DEX, seed)!;
      expect([...generations].sort((a, b) => a - b)).toEqual(generations);
    }
  });

  it("builds a 5x5 when the dataset supports it", () => {
    const board = generateBingoBoard({ ...rule, size: 5 }, MOCK_DEX, 99);
    expect(board?.generations).toHaveLength(5);
    expect(board?.types).toHaveLength(5);
    expect(thinnestCell(board!)).toBeGreaterThanOrEqual(rule.minAnswersPerCell);
  });

  it("returns null when the dataset can't fill a board — e.g. Gen 1 only", () => {
    const gen1Only = buildDataset({ 1: { normal: 20, fire: 20, water: 20 } });
    expect(generateBingoBoard(rule, gen1Only, 1)).toBeNull();
  });

  it("returns null when no generation trio shares enough usable types", () => {
    // Each generation is rich in a type the others lack, so no 3x3 exists.
    const disjoint = buildDataset({
      1: { fire: 9, water: 1, grass: 1 },
      2: { fire: 1, water: 9, grass: 1 },
      3: { fire: 1, water: 1, grass: 9 },
    });
    expect(generateBingoBoard(rule, disjoint, 1)).toBeNull();
  });
});
