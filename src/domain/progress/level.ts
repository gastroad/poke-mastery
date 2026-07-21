/** XP to go from level 1 to level 2. */
export const LEVEL_BASE = 300;
/** Additional XP each subsequent level requires (linear ramp). */
export const LEVEL_STEP = 200;

/** XP required to advance FROM `level` to `level + 1` (levels start at 1). */
export function xpToAdvance(level: number): number {
  return LEVEL_BASE + (level - 1) * LEVEL_STEP;
}

export interface LevelInfo {
  level: number;
  /** XP accumulated within the current level. */
  xpIntoLevel: number;
  /** XP needed to reach the next level from the start of this one. */
  xpForNext: number;
}

/** Resolve total XP into a level + progress-within-level (for the XP bar). */
export function resolveLevel(totalXp: number): LevelInfo {
  let level = 1;
  let remaining = Math.max(0, Math.floor(totalXp));
  while (remaining >= xpToAdvance(level)) {
    remaining -= xpToAdvance(level);
    level += 1;
  }
  return { level, xpIntoLevel: remaining, xpForNext: xpToAdvance(level) };
}
