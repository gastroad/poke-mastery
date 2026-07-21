import { describe, expect, it } from "vitest";
import { getChallenge } from "./catalog";
import { generateQuestions } from "./generateQuestions";
import { gradePlay } from "./gradePlay";
import type { Pokemon } from "../pokemon/types";

// 15 Gen-1 Pokémon so the 10-question beginner challenge has a full pool.
const dataset: Pokemon[] = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  nameKo: `포켓몬${i + 1}`,
  nameEn: `pokemon${i + 1}`,
  generation: 1,
  types: i % 2 === 0 ? ["fire"] : ["water"],
  acceptedAnswers: [`포켓몬${i + 1}`],
}));

const challenge = getChallenge("gen1:quiz")!;
const SEED = 42;
const questions = generateQuestions(challenge.rule, dataset, SEED);

describe("gradePlay", () => {
  it("returns null for an unknown challenge", () => {
    expect(gradePlay({ challengeId: "does-not-exist", seed: SEED, attempts: ["x"] }, dataset)).toBeNull();
  });

  it("re-judges attempts against the seed's questions", () => {
    const attempts = questions.map((q, i) => (i < 6 ? q.answer : "틀린답"));
    const graded = gradePlay({ challengeId: "gen1:quiz", seed: SEED, attempts }, dataset);
    expect(graded).not.toBeNull();
    expect(graded!.questionCount).toBe(10);
    expect(graded!.correctCount).toBe(6);
    expect(graded!.outcome[0].correct).toBe(true);
    expect(graded!.outcome[9].correct).toBe(false);
  });

  it("attaches each answered Pokémon's types (for mastery)", () => {
    const attempts = questions.map((q) => q.answer);
    const graded = gradePlay({ challengeId: "gen1:quiz", seed: SEED, attempts }, dataset)!;
    for (const item of graded.outcome) {
      expect(item.types.length).toBeGreaterThan(0);
    }
  });

  it("only grades what was attempted (early quit isn't penalised)", () => {
    const attempts = questions.slice(0, 3).map((q) => q.answer);
    const graded = gradePlay({ challengeId: "gen1:quiz", seed: SEED, attempts }, dataset)!;
    expect(graded.questionCount).toBe(3);
    expect(graded.correctCount).toBe(3);
  });

  it("is deterministic for the same record", () => {
    const attempts = questions.map((q) => q.answer);
    const a = gradePlay({ challengeId: "gen1:quiz", seed: SEED, attempts }, dataset);
    const b = gradePlay({ challengeId: "gen1:quiz", seed: SEED, attempts }, dataset);
    expect(a).toEqual(b);
  });
});
