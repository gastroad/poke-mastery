/**
 * Every line a board of this size can score: each row, each column, and the two
 * diagonals — `2 * size + 2` in total. Returned as cell indices so the UI can
 * light the exact cells up.
 */
export function boardLines(size: number): number[][] {
  if (!Number.isInteger(size) || size < 1) return [];
  const lines: number[][] = [];
  for (let r = 0; r < size; r++) {
    lines.push(Array.from({ length: size }, (_, c) => r * size + c));
  }
  for (let c = 0; c < size; c++) {
    lines.push(Array.from({ length: size }, (_, r) => r * size + c));
  }
  lines.push(Array.from({ length: size }, (_, i) => i * size + i));
  lines.push(Array.from({ length: size }, (_, i) => i * size + (size - 1 - i)));
  return lines;
}

/** The lines whose every cell is filled. */
export function completedLines(size: number, filled: readonly boolean[]): number[][] {
  return boardLines(size).filter((line) => line.every((i) => filled[i] === true));
}
