import { describe, expect, it } from "vitest";
import type { Pokemon } from "../pokemon/types";
import {
  GENDER_ANSWER,
  generateGenderQuestions,
  genderQuizPool,
  MIN_GENDER_DIFF_PX,
} from "./generateGenderQuestions";
import type { ChallengeRule } from "./types";

/** A view with `n` differing pixels; the crop box is irrelevant to these tests. */
const view = (n: number) => ({ pixels: n, box: { x: 0, y: 0, size: 26 } });

const mon = (id: number, genderDiff?: Pokemon["genderDiff"]): Pokemon => ({
  id,
  nameKo: `몬${id}`,
  nameEn: `mon${id}`,
  generation: 1,
  types: ["normal"],
  acceptedAnswers: [`몬${id}`],
  ...(genderDiff ? { genderDiff } : {}),
});

const dataset: Pokemon[] = [
  ...Array.from({ length: 20 }, (_, i) => mon(i + 1, { front: view(40), back: view(30) })),
  mon(101, { front: view(1), back: null }), // 아차모-style: a single pixel
  mon(102, { front: view(4), back: view(2) }), // 파치리스-style: below the floor
  mon(103, { front: view(0), back: view(60) }), // 브이젤-style: only visible from behind
  mon(200), // no gender difference at all
];

const rule: ChallengeRule = { mode: "gender", pool: {}, questionCount: 10 };

describe("genderQuizPool", () => {
  it("keeps only species whose sprites actually differ enough", () => {
    const ids = genderQuizPool(dataset).map((p) => p.id);
    expect(ids).toContain(1);
    expect(ids).not.toContain(200); // no difference recorded
    expect(ids).not.toContain(101); // one pixel — not a fair question
    expect(ids).not.toContain(102);
  });

  it("keeps a species that only differs from behind", () => {
    expect(genderQuizPool(dataset).map((p) => p.id)).toContain(103);
  });

  it("uses the documented floor", () => {
    const justUnder = [mon(1, { front: view(MIN_GENDER_DIFF_PX - 1), back: null })];
    const justOver = [mon(1, { front: view(MIN_GENDER_DIFF_PX), back: null })];
    expect(genderQuizPool(justUnder)).toHaveLength(0);
    expect(genderQuizPool(justOver)).toHaveLength(1);
  });
});

describe("generateGenderQuestions", () => {
  it("is deterministic: same seed produces identical questions", () => {
    expect(generateGenderQuestions(rule, dataset, 99)).toEqual(
      generateGenderQuestions(rule, dataset, 99),
    );
  });

  it("different seeds produce a different set", () => {
    const a = generateGenderQuestions(rule, dataset, 1);
    const b = generateGenderQuestions(rule, dataset, 2);
    expect(a).not.toEqual(b);
  });

  it("never repeats a species within one game", () => {
    const ids = generateGenderQuestions(rule, dataset, 5).map((q) => q.pokemonId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("asks exactly questionCount questions", () => {
    expect(generateGenderQuestions(rule, dataset, 5)).toHaveLength(10);
  });

  it("only draws from the qualifying pool", () => {
    const asked = new Set(generateGenderQuestions(rule, dataset, 7).map((q) => q.pokemonId));
    for (const excluded of [101, 102, 200]) expect(asked.has(excluded)).toBe(false);
  });

  it("answers with the gender it shows, and accepts exactly that", () => {
    for (const q of generateGenderQuestions(rule, dataset, 3)) {
      expect(q.gender === "male" || q.gender === "female").toBe(true);
      expect(q.answer).toBe(GENDER_ANSWER[q.gender!]);
      expect(q.acceptedAnswers).toEqual([q.answer]);
    }
  });

  it("shows both genders across a game rather than sticking to one", () => {
    const seen = new Set<string>();
    for (const seed of [1, 2, 3, 4, 5]) {
      for (const q of generateGenderQuestions(rule, dataset, seed)) seen.add(q.gender!);
    }
    expect(seen).toEqual(new Set(["male", "female"]));
  });

  it("is shorter than requested when the pool runs out", () => {
    const tiny = [mon(1, { front: view(40), back: null }), mon(2, { front: view(40), back: null })];
    expect(generateGenderQuestions(rule, tiny, 1)).toHaveLength(2);
  });
});
