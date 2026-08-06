import { MODES } from "../challenge/catalog";
import type { BadgeDef } from "./types";

/**
 * The badge catalog.
 *
 * Every game is worth a badge, which is the one metaphor this project gets for
 * free: badges in Pokémon are what you take away from beating a gym. So each
 * mode's first clear IS its gym badge, and the rest are milestones stacked on
 * top of them.
 */

/** One per game, awarded on its first clear at any range and difficulty. */
const MODE_BADGES: BadgeDef[] = MODES.map((mode) => ({
  id: `gym-${mode.id}`,
  name: `${mode.label} 배지`,
  description: `${mode.label}를 한 번 클리어하세요`,
  condition: { kind: "clearMode", modeId: mode.id },
}));

/** Clearing every level of one game — the badge's polished version. */
const MASTERY_BADGES: BadgeDef[] = MODES.map((mode) => ({
  id: `master-${mode.id}`,
  name: `${mode.label} 마스터`,
  description: `${mode.label}의 모든 난이도를 클리어하세요`,
  condition: { kind: "clearEveryDifficulty", modeId: mode.id },
}));

export const BADGES: BadgeDef[] = [
  ...MODE_BADGES,
  ...MASTERY_BADGES,
  {
    id: "first-clear",
    name: "첫 걸음",
    description: "아무 게임이나 한 번 클리어하세요",
    condition: { kind: "clearCount", min: 1 },
  },
  {
    id: "clear-10",
    name: "도전자",
    description: "서로 다른 도전 10개를 클리어하세요",
    condition: { kind: "clearCount", min: 10 },
  },
  {
    id: "first-perfect",
    name: "완벽주의자",
    description: "아무 게임이나 한 번 퍼펙트로 끝내세요",
    condition: { kind: "perfectCount", min: 1 },
  },
  {
    id: "perfect-5",
    name: "무결점",
    description: "서로 다른 도전 5개를 퍼펙트로 끝내세요",
    condition: { kind: "perfectCount", min: 5 },
  },
  {
    id: "champion",
    name: "챔피언 로드",
    description: "모든 게임을 한 번씩 클리어하세요",
    condition: { kind: "clearEveryMode" },
  },
  {
    id: "veteran",
    name: "베테랑 트레이너",
    description: "레벨 10에 도달하세요",
    condition: { kind: "level", min: 10 },
  },
];

export function getBadge(id: string): BadgeDef | undefined {
  return BADGES.find((b) => b.id === id);
}
