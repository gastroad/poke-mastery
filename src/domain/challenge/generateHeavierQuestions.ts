import type { Pokemon, PokemonId } from "../pokemon/types";
import { createRng } from "../rng/createRng";
import { shuffle } from "../rng/shuffle";
import type { ChallengeRule, Dataset, Question } from "./types";

/**
 * How many times heavier one of the pair has to be. Without a floor a fair
 * share of pairs are near-ties (60.0kg vs 60.5kg), which is a coin flip dressed
 * up as a question. Measured over the real dex, 1.5× still leaves ~85% of all
 * pairs usable, so the floor costs nothing in variety.
 */
export const MIN_WEIGHT_RATIO = 1.5;

/** The two sides, and what the player's tap sends as their attempt. */
export const HEAVIER_ANSWER = { left: "왼쪽", right: "오른쪽" } as const;

/** Pokémon with a usable weight. */
export function heavierQuizPool(dataset: Dataset): Pokemon[] {
  return dataset.filter((p) => p.weightHg > 0);
}

/** Is this pair decisive enough to ask about? */
export function isFairPair(a: Pokemon, b: Pokemon): boolean {
  const heavy = Math.max(a.weightHg, b.weightHg);
  const light = Math.min(a.weightHg, b.weightHg);
  return light > 0 && heavy / light >= MIN_WEIGHT_RATIO;
}

/**
 * "Which of these two is heavier?" — a pair per question, no Pokémon used twice
 * in a game, and never a pair close enough to be a guess.
 *
 * The answer is 왼쪽/오른쪽 rather than a name, so this rides the ordinary
 * `Question` shape and the server re-grades it through `gradePlay` with no
 * special case: same seed ⇒ same pairs, same sides, same answers.
 *
 * `pokemonId` carries the LEFT Pokémon (so progress credits its types) and the
 * right one rides along in `pairId`.
 */
export function generateHeavierQuestions(
  rule: ChallengeRule,
  dataset: Dataset,
  seed: number,
): Question[] {
  const rng = createRng(seed);
  const pool = shuffle(heavierQuizPool(dataset), rng);

  const questions: Question[] = [];
  const used = new Set<PokemonId>();
  for (let i = 0; i < pool.length && questions.length < rule.questionCount; i++) {
    const left = pool[i];
    if (used.has(left.id)) continue;
    // Walk on from here for the first partner that makes a decisive pair. The
    // pool is already shuffled, so this stays deterministic without being a
    // fixed neighbour.
    const partner = pool.find((p) => p.id !== left.id && !used.has(p.id) && isFairPair(left, p));
    if (!partner) continue;

    used.add(left.id);
    used.add(partner.id);
    const answer = left.weightHg > partner.weightHg ? HEAVIER_ANSWER.left : HEAVIER_ANSWER.right;
    questions.push({
      pokemonId: left.id,
      pairId: partner.id,
      answer,
      acceptedAnswers: [answer],
    });
  }
  return questions;
}
