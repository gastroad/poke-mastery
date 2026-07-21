import { describe, expect, it } from "vitest";
import { createRng } from "./createRng";
import { shuffle } from "./shuffle";

const source = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

describe("shuffle", () => {
  it("is deterministic for the same seed", () => {
    const a = shuffle(source, createRng(42));
    const b = shuffle(source, createRng(42));
    expect(a).toEqual(b);
  });

  it("is a permutation (same elements, order may differ)", () => {
    const result = shuffle(source, createRng(7));
    expect([...result].sort((x, y) => x - y)).toEqual(source);
  });

  it("does not mutate the input", () => {
    const input = [...source];
    shuffle(input, createRng(1));
    expect(input).toEqual(source);
  });

  it("actually reorders for a typical seed", () => {
    const result = shuffle(source, createRng(123));
    expect(result).not.toEqual(source);
  });
});
