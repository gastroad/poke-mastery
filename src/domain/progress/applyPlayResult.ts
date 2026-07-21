import { resolveLevel } from "./level";
import { applyOutcomeToStats } from "./mastery";
import { computeScore } from "./score";
import type { PlayOutcome, Progress, ProgressDelta } from "./types";

/** Progress for a player who has never played. */
export const EMPTY_PROGRESS: Progress = { totalXp: 0, typeStats: {} };

/**
 * The progression reducer: (current progress, this game's graded result) →
 * (new progress, a summary of what changed). Pure and shared by server (to
 * persist) and client (anonymous localStorage). Same inputs ⇒ same output, so
 * the server can recompute this from a PlayRecord and never trust client claims.
 */
export function applyPlayResult(
  progress: Progress,
  outcome: PlayOutcome,
): { progress: Progress; delta: ProgressDelta } {
  const score = computeScore(outcome.map((o) => o.correct));
  const xpGained = score; // XP == score (MVP)
  const totalXp = progress.totalXp + xpGained;

  const levelBefore = resolveLevel(progress.totalXp).level;
  const levelAfter = resolveLevel(totalXp).level;

  const next: Progress = {
    totalXp,
    typeStats: applyOutcomeToStats(progress.typeStats, outcome),
  };

  return {
    progress: next,
    delta: { score, xpGained, levelBefore, levelAfter, leveledUp: levelAfter > levelBefore },
  };
}
