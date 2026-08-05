import { describe, expect, it } from "vitest";
import { boardLines, completedLines } from "./lines";

describe("boardLines", () => {
  it("is every row, every column, and both diagonals", () => {
    expect(boardLines(3)).toHaveLength(2 * 3 + 2);
    expect(boardLines(5)).toHaveLength(2 * 5 + 2);
  });

  it("lays cells out row-major", () => {
    const lines = boardLines(3);
    expect(lines[0]).toEqual([0, 1, 2]); // first row
    expect(lines[3]).toEqual([0, 3, 6]); // first column
    expect(lines[6]).toEqual([0, 4, 8]); // ↘ diagonal
    expect(lines[7]).toEqual([2, 4, 6]); // ↙ diagonal
  });

  it("returns nothing for a nonsense size", () => {
    expect(boardLines(0)).toEqual([]);
    expect(boardLines(-1)).toEqual([]);
  });
});

describe("completedLines", () => {
  const none = Array(9).fill(false);

  it("finds nothing on an empty board", () => {
    expect(completedLines(3, none)).toEqual([]);
  });

  it("finds a filled row", () => {
    const filled = [...none];
    filled[3] = filled[4] = filled[5] = true;
    expect(completedLines(3, filled)).toEqual([[3, 4, 5]]);
  });

  it("finds a filled column", () => {
    const filled = [...none];
    filled[1] = filled[4] = filled[7] = true;
    expect(completedLines(3, filled)).toEqual([[1, 4, 7]]);
  });

  it("finds a filled diagonal", () => {
    const filled = [...none];
    filled[2] = filled[4] = filled[6] = true;
    expect(completedLines(3, filled)).toEqual([[2, 4, 6]]);
  });

  it("counts every line a full board completes", () => {
    expect(completedLines(3, Array(9).fill(true))).toHaveLength(8);
  });

  it("ignores a line that is one cell short", () => {
    const filled = [...none];
    filled[0] = filled[1] = true;
    expect(completedLines(3, filled)).toEqual([]);
  });
});
