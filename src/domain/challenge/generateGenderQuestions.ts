import type { Pokemon } from "../pokemon/types";
import { createRng } from "../rng/createRng";
import { shuffle } from "../rng/shuffle";
import type { ChallengeRule, Dataset, Question } from "./types";

/** The two answers, and what the player's tap sends as their attempt. */
export const GENDER_ANSWER = { male: "수컷", female: "암컷" } as const;
export type Gender = keyof typeof GENDER_ANSWER;

/**
 * Fewest differing pixels a species may have and still be asked about.
 *
 * Deliberately low. The count is a poor proxy for how VISIBLE a difference is —
 * 세꿀버리 differs by only 7px, but they are a bright orange marking on its face
 * and it reads instantly, while a diffuse 20px difference can be invisible. So
 * this only cuts the degenerate cases (아차모's single-pixel tail dot), and the
 * rest is a judgement call best made by playing.
 */
export const MIN_GENDER_DIFF_PX = 5;

/** Species whose male and female sprites differ enough to be worth asking about. */
export function genderQuizPool(dataset: Dataset): Pokemon[] {
  return dataset.filter((p) => {
    const diff = p.genderDiff;
    return diff !== undefined && Math.max(diff.front, diff.back ?? 0) >= MIN_GENDER_DIFF_PX;
  });
}

/**
 * "Is this one male or female?" — one species per question, never repeated
 * within a game, with the gender to display drawn from the same seeded RNG.
 *
 * Produces plain `Question`s (the answer is 암컷/수컷 rather than a name), so the
 * server re-grades this mode through the existing `gradePlay` path with no
 * special case: same seed ⇒ same species, same genders, same answers.
 */
export function generateGenderQuestions(
  rule: ChallengeRule,
  dataset: Dataset,
  seed: number,
): Question[] {
  const rng = createRng(seed);
  const picked = shuffle(genderQuizPool(dataset), rng).slice(0, rule.questionCount);
  return picked.map((p) => {
    const gender: Gender = rng() < 0.5 ? "male" : "female";
    const answer = GENDER_ANSWER[gender];
    return { pokemonId: p.id, answer, acceptedAnswers: [answer], gender };
  });
}
