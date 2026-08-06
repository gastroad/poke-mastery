import type { ChallengeRecord } from "../progress/challengeRecord";
import type { Progress } from "../progress/types";

/**
 * What a badge asks for. Conditions are DATA so the catalog stays declarative
 * and a pure function does all the judging — no badge rule ever lives in a
 * component, which is what keeps the server able to award them authoritatively.
 */
export type BadgeCondition =
  /** Cleared this game on any pool and any difficulty. */
  | { kind: "clearMode"; modeId: string }
  /** Cleared this game on EVERY difficulty it offers (pool doesn't matter). */
  | { kind: "clearEveryDifficulty"; modeId: string }
  /** Perfected this game at least once. */
  | { kind: "perfectMode"; modeId: string }
  /** Cleared at least one challenge in every game there is. */
  | { kind: "clearEveryMode" }
  /** This many distinct challenges cleared. */
  | { kind: "clearCount"; min: number }
  /** This many distinct challenges perfected. */
  | { kind: "perfectCount"; min: number }
  /** Reached this level. */
  | { kind: "level"; min: number };

export interface BadgeDef {
  id: string;
  name: string;
  /** What the player has to do — shown while it is still locked. */
  description: string;
  condition: BadgeCondition;
}

/**
 * Everything badge conditions may look at. Records are keyed by challenge id,
 * exactly as they are stored.
 */
export interface BadgeState {
  records: Record<string, ChallengeRecord>;
  progress: Progress;
}
