import type { PokemonType } from "../pokemon/types";
import { TYPE_NAME_KO } from "../pokemon/typeNames";
import type { ChallengeRule, GameMode, PoolFilter } from "./types";
import type { UnlockCondition } from "./unlock";

/**
 * A challenge is composed on the fly from a POOL (what Pokémon) × a MODE (how to
 * play). The id is `${poolId}:${modeId}`. Difficulty is emergent from the combo,
 * not assigned. Pools gate availability (e.g. later generations are "coming soon"
 * until their data is synced); every mode is available for an open pool.
 */

// ── Pools: the "what" ──
export interface PoolDef {
  id: string;
  label: string;
  filter: PoolFilter;
  unlock: UnlockCondition;
}

/** Only Gen 1 is synced; the rest are locked until their data lands. */
export const GENERATION_POOLS: PoolDef[] = [
  { id: "gen1", label: "1세대", filter: { generations: [1] }, unlock: { kind: "always" } },
  ...[2, 3, 4, 5, 6, 7, 8, 9].map(
    (n): PoolDef => ({
      id: `gen${n}`,
      label: `${n}세대`,
      filter: { generations: [n] },
      unlock: { kind: "comingSoon" },
    }),
  ),
  { id: "all", label: "전세대", filter: {}, unlock: { kind: "comingSoon" } },
];

export const TYPE_POOLS: PoolDef[] = (Object.keys(TYPE_NAME_KO) as PokemonType[]).map((type) => ({
  id: `type-${type}`,
  label: `${TYPE_NAME_KO[type]} 타입`,
  filter: { types: [type] },
  unlock: { kind: "comingSoon" },
}));

export const POOLS: PoolDef[] = [...GENERATION_POOLS, ...TYPE_POOLS];

export function getPool(id: string): PoolDef | undefined {
  return POOLS.find((p) => p.id === id);
}

// ── Modes: the "how" ──
export interface ModeDef {
  id: GameMode;
  label: string;
  description: string;
  /** The mode's rule params (the pool is filled in per selection). */
  rule: Omit<ChallengeRule, "pool">;
}

export const MODES: ModeDef[] = [
  { id: "quiz", label: "기본", description: "10문제, 실루엣 이름 맞히기", rule: { mode: "quiz", questionCount: 10 } },
  {
    id: "time-attack",
    label: "타임어택",
    description: "60초 안에 최대한 많이",
    // large count so the pool never runs out before the clock (capped at pool size)
    rule: { mode: "time-attack", questionCount: 1000, timeLimitSec: 60 },
  },
  {
    id: "reveal-rush",
    label: "리빌 러시",
    description: "빨리 맞힐수록 고득점",
    rule: { mode: "reveal-rush", questionCount: 12, revealSec: 6 },
  },
];

export function getMode(id: string): ModeDef | undefined {
  return MODES.find((m) => m.id === id);
}

// ── Challenge = pool × mode ──
export interface ChallengeDef {
  id: string;
  title: string;
  rule: ChallengeRule;
}

export function challengeId(poolId: string, modeId: string): string {
  return `${poolId}:${modeId}`;
}

/** Build a playable challenge from its `poolId:modeId`. Returns undefined for an
 * unknown or not-yet-available (coming-soon) pool, so locked pools can't be played. */
export function getChallenge(id: string): ChallengeDef | undefined {
  const [poolId, modeId] = id.split(":");
  const pool = getPool(poolId);
  const mode = getMode(modeId);
  if (!pool || !mode || pool.unlock.kind === "comingSoon") return undefined;
  return {
    id,
    title: `${pool.label} · ${mode.label}`,
    rule: { ...mode.rule, pool: pool.filter },
  };
}
