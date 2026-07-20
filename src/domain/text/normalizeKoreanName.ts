/**
 * Normalizes a Korean Pokémon-name string for answer comparison.
 *
 * Rules (confirmed MVP decision):
 *  - NFC-normalize (so decomposed and composed Hangul compare equal)
 *  - remove ALL whitespace (Gen 1 Korean names contain none)
 *
 * Pure: no framework/IO. Used by both client (instant feedback) and
 * server (authoritative re-judge) so results always agree.
 */
export function normalizeKoreanName(input: string): string {
  return input.normalize("NFC").replace(/\s+/g, "");
}
