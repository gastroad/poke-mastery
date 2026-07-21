import { describe, expect, it } from "vitest";
import { generateQuestions } from "./generateQuestions";
import type { ChallengeRule } from "./types";
import type { Pokemon } from "../pokemon/types";

const dataset: Pokemon[] = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  nameKo: `포켓몬${i + 1}`,
  nameEn: `pokemon${i + 1}`,
  generation: 1,
  types: ["normal"],
  acceptedAnswers: [`포켓몬${i + 1}`],
}));

const rule: ChallengeRule = { mode: "quiz", pool: { generations: [1] }, questionCount: 10 };

describe("generateQuestions", () => {
  it("is deterministic: same seed produces identical questions", () => {
    expect(generateQuestions(rule, dataset, 777)).toEqual(generateQuestions(rule, dataset, 777));
  });

  it("different seeds produce a different set/order", () => {
    const a = generateQuestions(rule, dataset, 1).map((q) => q.pokemonId);
    const b = generateQuestions(rule, dataset, 2).map((q) => q.pokemonId);
    expect(a).not.toEqual(b);
  });

  it("produces exactly questionCount questions when the pool is large enough", () => {
    expect(generateQuestions(rule, dataset, 5)).toHaveLength(10);
  });

  it("never repeats a Pokémon within one game", () => {
    const ids = generateQuestions(rule, dataset, 5).map((q) => q.pokemonId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only draws from the filtered pool", () => {
    const withGen2: Pokemon[] = [
      ...dataset,
      { id: 999, nameKo: "치코리타", nameEn: "chikorita", generation: 2, types: ["grass"], acceptedAnswers: ["치코리타"] },
    ];
    const ids = generateQuestions(rule, withGen2, 5).map((q) => q.pokemonId);
    expect(ids).not.toContain(999);
  });

  it("shortens the game when the pool is smaller than questionCount", () => {
    const small = dataset.slice(0, 3);
    expect(generateQuestions(rule, small, 5)).toHaveLength(3);
  });

  it("carries the display answer and accepted answers through", () => {
    const [q] = generateQuestions(rule, dataset, 5);
    expect(q.answer).toMatch(/^포켓몬\d+$/);
    expect(q.acceptedAnswers).toContain(q.answer);
  });
});
