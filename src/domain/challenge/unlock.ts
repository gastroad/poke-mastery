import type { PokemonType } from "../pokemon/types";
import { TYPE_NAME_KO } from "../pokemon/typeNames";
import { resolveLevel } from "../progress/level";
import { isTypeMastered } from "../progress/mastery";
import type { Progress } from "../progress/types";

/**
 * Data-driven unlock conditions (discriminated union), judged by a pure
 * evaluator — same pattern as badges. Unlocks are DERIVED from progress, never
 * stored. Add a new gate by extending the union + the switch.
 */
export type UnlockCondition =
  | { kind: "always" }
  | { kind: "level"; min: number }
  | { kind: "typeMastery"; type: PokemonType; minPct: number };

export function isUnlocked(condition: UnlockCondition, progress: Progress): boolean {
  switch (condition.kind) {
    case "always":
      return true;
    case "level":
      return resolveLevel(progress.totalXp).level >= condition.min;
    case "typeMastery":
      return isTypeMastered(progress.typeStats[condition.type], condition.minPct);
  }
}

/** Human-readable requirement, shown on locked challenges. */
export function describeUnlock(condition: UnlockCondition): string {
  switch (condition.kind) {
    case "always":
      return "항상 열림";
    case "level":
      return `레벨 ${condition.min} 필요`;
    case "typeMastery":
      return `${TYPE_NAME_KO[condition.type]} 타입 마스터리 ${condition.minPct}% 필요`;
  }
}
