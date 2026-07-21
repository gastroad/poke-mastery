import type { PlayOutcome, Progress, TypeStat } from "./types";

/** A type must be seen at least this many times before its mastery gates unlocks. */
export const MASTERY_MIN_SEEN = 10;

/** Mastery percent for a type = accuracy (correct / seen), rounded. 0 if never seen. */
export function masteryPct(stat: TypeStat | undefined): number {
  if (!stat || stat.seen === 0) return 0;
  return Math.round((stat.correct / stat.seen) * 100);
}

/** True once a type has enough exposure AND accuracy to count as "mastered". */
export function isTypeMastered(stat: TypeStat | undefined, minPct: number): boolean {
  if (!stat || stat.seen < MASTERY_MIN_SEEN) return false;
  return masteryPct(stat) >= minPct;
}

/** Fold one game's per-type seen/correct counts into existing stats (immutably). */
export function applyOutcomeToStats(
  stats: Progress["typeStats"],
  outcome: PlayOutcome,
): Progress["typeStats"] {
  const next: Progress["typeStats"] = { ...stats };
  for (const item of outcome) {
    for (const type of item.types) {
      const prev = next[type] ?? { seen: 0, correct: 0 };
      next[type] = {
        seen: prev.seen + 1,
        correct: prev.correct + (item.correct ? 1 : 0),
      };
    }
  }
  return next;
}
