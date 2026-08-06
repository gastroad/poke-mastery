/**
 * Each game wears a real Poké Ball variant as its identity. Drawing the palette
 * from the ball lineup rather than picking six arbitrary hues means the colours
 * carry meaning a player already knows — and 암수 구별 getting the 러브볼 is the
 * kind of joke the subject hands you for free.
 *
 * Presentation only, which is why it lives in `client/` and not on `ModeDef`:
 * the domain has no opinion about what a game looks like.
 */
export interface ModeBall {
  /** Upper half of the ball. */
  color: string;
  /** Named for the icon's accessible label. */
  name: string;
}

const BALLS: Record<string, ModeBall> = {
  quiz: { color: "#ee1a24", name: "몬스터볼" },
  "time-attack": { color: "#2f6fd0", name: "슈퍼볼" },
  "reveal-rush": { color: "#f0b429", name: "하이퍼볼" },
  bingo: { color: "#7c3aed", name: "마스터볼" },
  heavier: { color: "#5f8f3a", name: "사파리볼" },
  gender: { color: "#e0509b", name: "러브볼" },
};

const DEFAULT_BALL: ModeBall = BALLS.quiz;

export function modeBall(modeId: string): ModeBall {
  return BALLS[modeId] ?? DEFAULT_BALL;
}
