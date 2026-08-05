import { describe, expect, it } from "vitest";
import { getChallenge } from "./catalog";
import { generateQuestions } from "./generateQuestions";
import { gradePlay } from "./gradePlay";
import type { Pokemon } from "../pokemon/types";
import { cellAnswers, cellsOf } from "../bingo/cellAnswers";
import { generateBingoBoard } from "../bingo/generateBoard";

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

describe("gradePlay — bingo", () => {
  // A board needs several generations to have a row axis at all.
  const dex: Pokemon[] = [];
  let id = 1;
  for (const generation of [1, 2, 3, 4]) {
    for (const type of ["fire", "water", "grass", "electric"] as const) {
      for (let n = 0; n < 6; n++) {
        dex.push({
          id,
          nameKo: `몬${id}`,
          nameEn: `mon${id}`,
          generation,
          types: [type],
          acceptedAnswers: [`몬${id}`],
        });
        id++;
      }
    }
  }

  const CHALLENGE = "all:bingo-3";
  const BINGO_SEED = 7;
  const rule = getChallenge(CHALLENGE)!.rule;

  /** The answer the board itself expects in each cell, never reusing a Pokémon. */
  function perfectAttempts(): string[] {
    const board = generateBingoBoard(
      { size: rule.boardSize!, minAnswersPerCell: rule.minAnswersPerCell!, attempts: 0 },
      dex,
      BINGO_SEED,
    )!;
    const used = new Set<number>();
    return cellsOf(board).map((cell) => {
      const pick = cellAnswers(dex, cell.generation, cell.type).find((p) => !used.has(p.id));
      if (pick) used.add(pick.id);
      return pick?.nameKo ?? "";
    });
  }

  it("rebuilds the board from the seed and counts a filled board", () => {
    const graded = gradePlay(
      { challengeId: CHALLENGE, seed: BINGO_SEED, attempts: perfectAttempts() },
      dex,
    );
    expect(graded!.questionCount).toBe(9);
    expect(graded!.correctCount).toBe(9);
  });

  it("reports one outcome per cell, misses included", () => {
    const attempts = perfectAttempts();
    attempts[8] = "";
    const graded = gradePlay({ challengeId: CHALLENGE, seed: BINGO_SEED, attempts }, dex);
    expect(graded!.outcome).toHaveLength(9);
    expect(graded!.correctCount).toBe(8);
  });

  it("ignores a placement the client made up", () => {
    const attempts = perfectAttempts();
    attempts[0] = "없는포켓몬";
    const graded = gradePlay({ challengeId: CHALLENGE, seed: BINGO_SEED, attempts }, dex);
    expect(graded!.correctCount).toBe(8);
  });

  it("ignores a Pokémon reused across two cells", () => {
    const attempts = perfectAttempts();
    attempts[1] = attempts[0];
    const graded = gradePlay({ challengeId: CHALLENGE, seed: BINGO_SEED, attempts }, dex);
    expect(graded!.correctCount).toBe(8);
  });

  it("grades a different seed against a different board", () => {
    const boardFor = (seed: number) =>
      generateBingoBoard(
        { size: rule.boardSize!, minAnswersPerCell: rule.minAnswersPerCell!, attempts: 0 },
        dex,
        seed,
      );
    // This mock dex is small enough that neighbouring seeds can land on the same
    // board, so find one that genuinely differs rather than assuming seed+1 does.
    const mine = JSON.stringify(boardFor(BINGO_SEED));
    const otherSeed = Array.from({ length: 50 }, (_, i) => BINGO_SEED + i + 1).find(
      (s) => JSON.stringify(boardFor(s)) !== mine,
    )!;
    expect(otherSeed).toBeDefined();

    const graded = gradePlay(
      { challengeId: CHALLENGE, seed: otherSeed, attempts: perfectAttempts() },
      dex,
    );
    expect(graded!.correctCount).toBeLessThan(9);
  });
});

describe("gradePlay — gender quiz", () => {
  const dex: Pokemon[] = Array.from({ length: 15 }, (_, i) => ({
    id: i + 1,
    nameKo: `몬${i + 1}`,
    nameEn: `mon${i + 1}`,
    generation: 1,
    types: ["normal"],
    acceptedAnswers: [`몬${i + 1}`],
    genderDiff: { front: { pixels: 40, box: { x: 0, y: 0, size: 26 } }, back: { pixels: 20, box: { x: 0, y: 0, size: 26 } } },
  }));
  const CHALLENGE = "all:gender";
  const GENDER_SEED = 31;

  it("re-judges 암컷/수컷 taps through the ordinary path", () => {
    const questions = generateQuestions(getChallenge(CHALLENGE)!.rule, dex, GENDER_SEED);
    const attempts = questions.map((q, i) => (i < 7 ? q.answer : "틀린답"));
    const graded = gradePlay({ challengeId: CHALLENGE, seed: GENDER_SEED, attempts }, dex);
    expect(graded!.questionCount).toBe(10);
    expect(graded!.correctCount).toBe(7);
  });

  it("credits the answered species' types, so mastery still moves", () => {
    const questions = generateQuestions(getChallenge(CHALLENGE)!.rule, dex, GENDER_SEED);
    const graded = gradePlay(
      { challengeId: CHALLENGE, seed: GENDER_SEED, attempts: questions.map((q) => q.answer) },
      dex,
    );
    expect(graded!.outcome.every((o) => o.types.includes("normal") && o.correct)).toBe(true);
  });

  it("a guess recorded against a different seed's question is simply wrong", () => {
    const questions = generateQuestions(getChallenge(CHALLENGE)!.rule, dex, GENDER_SEED);
    const graded = gradePlay(
      { challengeId: CHALLENGE, seed: GENDER_SEED + 1, attempts: questions.map((q) => q.answer) },
      dex,
    );
    expect(graded!.correctCount).toBeLessThan(10);
  });
});
