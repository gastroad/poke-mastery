import { describe, expect, it } from "vitest";
import { filterPool } from "./filterPool";
import type { Pokemon } from "../pokemon/types";

const dataset: Pokemon[] = [
  { id: 1, nameKo: "이상해씨", nameEn: "bulbasaur", generation: 1, types: ["grass", "poison"], heightDm: 10, weightHg: 100, acceptedAnswers: ["이상해씨"] },
  { id: 4, nameKo: "파이리", nameEn: "charmander", generation: 1, types: ["fire"], heightDm: 10, weightHg: 100, acceptedAnswers: ["파이리"] },
  { id: 25, nameKo: "피카츄", nameEn: "pikachu", generation: 1, types: ["electric"], heightDm: 10, weightHg: 100, acceptedAnswers: ["피카츄"] },
  { id: 152, nameKo: "치코리타", nameEn: "chikorita", generation: 2, types: ["grass"], heightDm: 10, weightHg: 100, acceptedAnswers: ["치코리타"] },
];

describe("filterPool", () => {
  it("returns everything for an empty filter, in input order", () => {
    expect(filterPool(dataset, {}).map((p) => p.id)).toEqual([1, 4, 25, 152]);
  });

  it("filters by generation", () => {
    expect(filterPool(dataset, { generations: [1] }).map((p) => p.id)).toEqual([1, 4, 25]);
  });

  it("filters by type (matches any listed type)", () => {
    expect(filterPool(dataset, { types: ["grass"] }).map((p) => p.id)).toEqual([1, 152]);
  });

  it("combines generation and type as AND", () => {
    expect(filterPool(dataset, { generations: [1], types: ["grass"] }).map((p) => p.id)).toEqual([1]);
  });

  it("returns empty when nothing matches", () => {
    expect(filterPool(dataset, { generations: [9] })).toEqual([]);
  });
});
