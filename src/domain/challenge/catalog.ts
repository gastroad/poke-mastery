import type { Progress } from "../progress/types";
import type { ChallengeRule } from "./types";
import { isUnlocked, type UnlockCondition } from "./unlock";

/**
 * A playable challenge = a rule (what questions) + an unlock gate (when it opens).
 * This is the single source of truth for what a player can play; `id` is the
 * `challengeId` carried in a PlayRecord.
 */
export interface ChallengeDef {
  id: string;
  title: string;
  description: string;
  rule: ChallengeRule;
  unlock: UnlockCondition;
}

export const CHALLENGES: ChallengeDef[] = [
  {
    id: "kanto-beginner",
    title: "관동 초급",
    description: "관동 포켓몬 10마리, 실루엣 이름 맞히기",
    rule: { mode: "quiz", pool: { generations: [1] }, questionCount: 10 },
    unlock: { kind: "always" },
  },
  {
    id: "kanto-marathon",
    title: "관동 마라톤",
    description: "관동 포켓몬 20마리 연속 도전",
    rule: { mode: "quiz", pool: { generations: [1] }, questionCount: 20 },
    unlock: { kind: "level", min: 5 },
  },
  {
    id: "fire-trial",
    title: "불꽃 시련",
    description: "불꽃 타입만 출제되는 심화 챌린지",
    rule: { mode: "quiz", pool: { generations: [1], types: ["fire"] }, questionCount: 10 },
    unlock: { kind: "typeMastery", type: "fire", minPct: 70 },
  },
  {
    id: "water-trial",
    title: "물결 시련",
    description: "물 타입만 출제되는 심화 챌린지",
    rule: { mode: "quiz", pool: { generations: [1], types: ["water"] }, questionCount: 10 },
    unlock: { kind: "typeMastery", type: "water", minPct: 70 },
  },
  {
    id: "kanto-time-attack",
    title: "관동 타임어택",
    description: "60초 안에 최대한 많이 맞히기",
    // questionCount = whole Kanto pool so you never run out before the clock.
    rule: { mode: "time-attack", pool: { generations: [1] }, questionCount: 151, timeLimitSec: 60 },
    unlock: { kind: "always" },
  },
];

/** The always-open starter challenge (what /play runs by default). */
export const BEGINNER_CHALLENGE = CHALLENGES[0];

export function getChallenge(id: string): ChallengeDef | undefined {
  return CHALLENGES.find((c) => c.id === id);
}

/** Challenges currently open for a given progress (unlocks are derived). */
export function unlockedChallenges(progress: Progress): ChallengeDef[] {
  return CHALLENGES.filter((c) => isUnlocked(c.unlock, progress));
}
