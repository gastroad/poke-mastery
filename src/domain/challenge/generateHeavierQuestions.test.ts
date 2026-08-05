import { describe, expect, it } from "vitest";
import type { Pokemon } from "../pokemon/types";
import {
  generateHeavierQuestions,
  HEAVIER_ANSWER,
  isFairPair,
  MIN_WEIGHT_RATIO,
} from "./generateHeavierQuestions";
import type { ChallengeRule } from "./types";

const mon = (id: number, weightHg: number): Pokemon => ({
  id,
  nameKo: `몬${id}`,
  nameEn: `mon${id}`,
  generation: 1,
  types: ["normal"],
  heightDm: 10,
  weightHg,
  acceptedAnswers: [`몬${id}`],
});

/** Weights an order of magnitude apart, so every pair is decisive. */
const dataset: Pokemon[] = Array.from({ length: 40 }, (_, i) => mon(i + 1, (i + 1) * 50));
const rule: ChallengeRule = { mode: "heavier", pool: {}, questionCount: 10 };

const weightOf = (dex: Pokemon[], id?: number) => dex.find((p) => p.id === id)!.weightHg;

describe("isFairPair", () => {
  it("accepts a pair one side clearly wins", () => {
    expect(isFairPair(mon(1, 100), mon(2, 1000))).toBe(true);
  });

  it("rejects a near-tie, which would just be a coin flip", () => {
    expect(isFairPair(mon(1, 600), mon(2, 605))).toBe(false);
  });

  it("uses the documented ratio, either way round", () => {
    expect(isFairPair(mon(1, 100), mon(2, 100 * MIN_WEIGHT_RATIO))).toBe(true);
    expect(isFairPair(mon(1, 100 * MIN_WEIGHT_RATIO), mon(2, 100))).toBe(true);
    expect(isFairPair(mon(1, 100), mon(2, 100 * MIN_WEIGHT_RATIO - 1))).toBe(false);
  });

  it("rejects a weightless Pokémon rather than dividing by zero", () => {
    expect(isFairPair(mon(1, 0), mon(2, 500))).toBe(false);
  });
});

describe("generateHeavierQuestions", () => {
  it("is deterministic: same seed produces identical questions", () => {
    expect(generateHeavierQuestions(rule, dataset, 11)).toEqual(
      generateHeavierQuestions(rule, dataset, 11),
    );
  });

  it("different seeds produce different pairs", () => {
    expect(generateHeavierQuestions(rule, dataset, 1)).not.toEqual(
      generateHeavierQuestions(rule, dataset, 2),
    );
  });

  it("asks questionCount questions when the pool allows", () => {
    expect(generateHeavierQuestions(rule, dataset, 4)).toHaveLength(10);
  });

  it("never reuses a Pokémon anywhere in the game", () => {
    const seen = generateHeavierQuestions(rule, dataset, 6).flatMap((q) => [q.pokemonId, q.pairId]);
    expect(new Set(seen).size).toBe(seen.length);
  });

  it("only asks decisive pairs", () => {
    for (const q of generateHeavierQuestions(rule, dataset, 8)) {
      const left = dataset.find((p) => p.id === q.pokemonId)!;
      const right = dataset.find((p) => p.id === q.pairId)!;
      expect(isFairPair(left, right)).toBe(true);
    }
  });

  it("answers with the side that is actually heavier", () => {
    for (const q of generateHeavierQuestions(rule, dataset, 9)) {
      const left = weightOf(dataset, q.pokemonId);
      const right = weightOf(dataset, q.pairId);
      expect(q.answer).toBe(left > right ? HEAVIER_ANSWER.left : HEAVIER_ANSWER.right);
      expect(q.acceptedAnswers).toEqual([q.answer]);
    }
  });

  it("puts the heavier one on both sides across a game, not always the same one", () => {
    const answers = new Set(
      [1, 2, 3, 4, 5].flatMap((seed) =>
        generateHeavierQuestions(rule, dataset, seed).map((q) => q.answer),
      ),
    );
    expect(answers).toEqual(new Set([HEAVIER_ANSWER.left, HEAVIER_ANSWER.right]));
  });

  it("skips a Pokémon that has no decisive partner left", () => {
    // Three identical weights and one outlier: only one pair can be formed.
    const flat = [mon(1, 500), mon(2, 500), mon(3, 500), mon(4, 5000)];
    expect(generateHeavierQuestions(rule, flat, 3)).toHaveLength(1);
  });

  it("returns nothing when no pair is decisive", () => {
    const identical = Array.from({ length: 6 }, (_, i) => mon(i + 1, 500));
    expect(generateHeavierQuestions(rule, identical, 3)).toEqual([]);
  });
});
