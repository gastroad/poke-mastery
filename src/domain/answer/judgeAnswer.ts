import { normalizeKoreanName } from "../text/normalizeKoreanName";

/**
 * Judge a typed answer against a Pokémon's accepted answers.
 *
 * `acceptedAnswers` is expected to already be normalized (the data pipeline
 * normalizes it). We normalize the player's raw input the same way, then check
 * membership — so "  피카츄 " matches "피카츄", and Nidoran accepts both genders.
 */
export function judgeAnswer(input: string, acceptedAnswers: readonly string[]): boolean {
  const normalized = normalizeKoreanName(input);
  if (normalized.length === 0) return false;
  return acceptedAnswers.includes(normalized);
}
