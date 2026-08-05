/**
 * Korean particles agree with whether the preceding syllable ends in a
 * consonant, so a fixed "은(는)" reads like a form letter. Hangul syllables are
 * laid out so that (code - 0xac00) % 28 gives the trailing consonant, 0 meaning
 * there is none — which is all we need to choose.
 *
 * Presentation only: no game rule depends on this, so it lives in client/.
 */
export function withParticle(word: string, withFinal: string, withoutFinal: string): string {
  const last = word.trim().at(-1) ?? "";
  const code = last.charCodeAt(0);
  const isHangul = code >= 0xac00 && code <= 0xd7a3;
  const hasFinal = isHangul && (code - 0xac00) % 28 !== 0;
  return `${word}${hasFinal ? withFinal : withoutFinal}`;
}
