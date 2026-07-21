/** Points for a single correct answer with no combo. */
export const SCORE_BASE = 100;
/** Extra points added per consecutive-correct streak step (combo reward). */
export const SCORE_COMBO_STEP = 20;

/**
 * Score one game from its ordered correct/wrong results.
 * Each correct answer scores BASE + (currentStreak * COMBO_STEP); a wrong answer
 * breaks the streak. So 1st correct = 100, 2nd in a row = 120, 3rd = 140, …
 */
export function computeScore(results: readonly boolean[]): number {
  let score = 0;
  let streak = 0;
  for (const correct of results) {
    if (correct) {
      score += SCORE_BASE + streak * SCORE_COMBO_STEP;
      streak += 1;
    } else {
      streak = 0;
    }
  }
  return score;
}
