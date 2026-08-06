import type { ClearStatus } from "../challenge/clear";

/**
 * A player's standing on ONE challenge (pool × mode × difficulty).
 *
 * `cleared` and `perfect` are sticky — they say "you once did this", not "your
 * last run did this". A record that could be lost would make badges revocable,
 * and an achievement you can lose by playing again is a reason not to play again.
 */
export interface ChallengeRecord {
  bestScore: number;
  cleared: boolean;
  perfect: boolean;
  playCount: number;
}

export const EMPTY_RECORD: ChallengeRecord = {
  bestScore: 0,
  cleared: false,
  perfect: false,
  playCount: 0,
};

/** What this particular play changed — the end-of-game celebration reads it. */
export interface RecordDelta {
  /** Beat the previous best (a first score above zero counts). */
  newBest: boolean;
  /** Cleared for the first time ever. */
  firstClear: boolean;
  /** Perfected for the first time ever. */
  firstPerfect: boolean;
}

/**
 * Fold one finished game into a challenge record. Pure and shared by the server
 * (to persist) and the client (anonymous localStorage), exactly like
 * `applyPlayResult` — same inputs ⇒ same output.
 */
export function applyPlayToRecord(
  record: ChallengeRecord,
  play: { score: number; status: ClearStatus },
): { record: ChallengeRecord; delta: RecordDelta } {
  const newBest = play.score > record.bestScore;
  const firstClear = play.status.cleared && !record.cleared;
  const firstPerfect = play.status.perfect && !record.perfect;

  return {
    record: {
      bestScore: newBest ? play.score : record.bestScore,
      cleared: record.cleared || play.status.cleared,
      perfect: record.perfect || play.status.perfect,
      playCount: record.playCount + 1,
    },
    delta: { newBest, firstClear, firstPerfect },
  };
}
