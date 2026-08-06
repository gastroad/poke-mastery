import { getMode, MODES, parseChallengeId } from "../challenge/catalog";
import type { ChallengeRecord } from "../progress/challengeRecord";
import { resolveLevel } from "../progress/level";
import { BADGES } from "./catalog";
import type { BadgeCondition, BadgeState } from "./types";

/** Records for one mode, whatever pool or difficulty they were set on. */
function recordsForMode(
  state: BadgeState,
  modeId: string,
): { difficultyId: string; record: ChallengeRecord }[] {
  const out: { difficultyId: string; record: ChallengeRecord }[] = [];
  for (const [id, record] of Object.entries(state.records)) {
    const parsed = parseChallengeId(id);
    if (parsed?.modeId === modeId) out.push({ difficultyId: parsed.difficultyId, record });
  }
  return out;
}

function countWhere(state: BadgeState, pick: (r: ChallengeRecord) => boolean): number {
  return Object.values(state.records).filter(pick).length;
}

export function meetsCondition(condition: BadgeCondition, state: BadgeState): boolean {
  switch (condition.kind) {
    case "clearMode":
      return recordsForMode(state, condition.modeId).some((r) => r.record.cleared);

    case "clearEveryDifficulty": {
      const mode = getMode(condition.modeId);
      if (!mode) return false;
      // Cleared on ANY pool counts for a difficulty — the badge is about having
      // beaten every level of the game, not about grinding all 28 pools.
      const clearedLevels = new Set(
        recordsForMode(state, condition.modeId)
          .filter((r) => r.record.cleared)
          .map((r) => r.difficultyId),
      );
      return mode.difficulties.every((d) => clearedLevels.has(d.id));
    }

    case "perfectMode":
      return recordsForMode(state, condition.modeId).some((r) => r.record.perfect);

    case "clearEveryMode":
      return MODES.every((mode) => recordsForMode(state, mode.id).some((r) => r.record.cleared));

    case "clearCount":
      return countWhere(state, (r) => r.cleared) >= condition.min;

    case "perfectCount":
      return countWhere(state, (r) => r.perfect) >= condition.min;

    case "level":
      return resolveLevel(state.progress.totalXp).level >= condition.min;
  }
}

/** Every badge the player currently qualifies for, in catalog order. */
export function earnedBadges(state: BadgeState): string[] {
  return BADGES.filter((b) => meetsCondition(b.condition, state)).map((b) => b.id);
}

/**
 * The badges this play just unlocked.
 *
 * Judged against what is ALREADY recorded as earned rather than recomputed from
 * scratch, so a badge is announced once and stays earned even if the catalog
 * later changes what it asks for.
 */
export function newlyEarnedBadges(state: BadgeState, alreadyEarned: readonly string[]): string[] {
  const had = new Set(alreadyEarned);
  return earnedBadges(state).filter((id) => !had.has(id));
}
