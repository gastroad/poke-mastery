import { createRng } from "../rng/createRng";
import { shuffle } from "../rng/shuffle";
import { filterPool } from "./filterPool";
import type { ChallengeRule, Dataset, Question } from "./types";

/**
 * Turn (rule + dataset + seed) into the exact question set for one game.
 *
 * DETERMINISTIC: same rule + same dataset + same seed ⇒ identical questions,
 * anywhere. This is the contract the server relies on to replay a client's game
 * from just the seed and recompute the result without trusting the client.
 *
 * If the filtered pool is smaller than `questionCount`, the game is simply
 * shorter (we never repeat a Pokémon within one game).
 */
export function generateQuestions(rule: ChallengeRule, dataset: Dataset, seed: number): Question[] {
  const pool = filterPool(dataset, rule.pool);
  const rng = createRng(seed);
  const picked = shuffle(pool, rng).slice(0, rule.questionCount);
  return picked.map((p) => ({
    pokemonId: p.id,
    answer: p.nameKo,
    acceptedAnswers: p.acceptedAnswers,
  }));
}
