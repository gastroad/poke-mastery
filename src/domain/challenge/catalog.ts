import type { PokemonType } from "../pokemon/types";
import { TYPE_NAME_KO } from "../pokemon/typeNames";
import type { ChallengeRule, PoolFilter } from "./types";
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
  // Open, but only bingo is offered here — see `modesForPool`.
  { id: "all", label: "전세대", filter: {}, unlock: { kind: "always" } },
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
  /** Not the same thing as `rule.mode`: bingo ships two sizes as two entries. */
  id: string;
  label: string;
  description: string;
  /**
   * Whether this mode needs the WHOLE dex. Bingo does — its rows are
   * generations and its columns are types, so any pool filter would collapse an
   * axis. The silhouette modes are the mirror image: they need the big artwork
   * sprite, which is only synced for gen 1, so they stay off the full-dex pool.
   * One flag keeps the two sets from ever overlapping.
   */
  fullDex: boolean;
  /** The mode's rule params (the pool is filled in per selection). */
  rule: Omit<ChallengeRule, "pool">;
}

/** Bingo attempts for the whole board: one per cell, plus half again as slack. */
const bingoAttempts = (size: number) => size * size + Math.floor((size * size) / 2);

const bingoMode = (size: number): ModeDef => ({
  id: `bingo-${size}`,
  label: `빙고 ${size}×${size}`,
  description: `세대 × 타입 ${size}×${size} 판 채우기`,
  fullDex: true,
  rule: {
    mode: "bingo",
    // Every cell is one thing to answer, which is what questionCount means here.
    questionCount: size * size,
    boardSize: size,
    minAnswersPerCell: 5,
    attempts: bingoAttempts(size),
  },
});

export const MODES: ModeDef[] = [
  {
    id: "quiz",
    label: "기본",
    description: "10문제, 실루엣 이름 맞히기",
    fullDex: false,
    rule: { mode: "quiz", questionCount: 10 },
  },
  {
    id: "time-attack",
    label: "타임어택",
    description: "60초 안에 최대한 많이",
    fullDex: false,
    // large count so the pool never runs out before the clock (capped at pool size)
    rule: { mode: "time-attack", questionCount: 1000, timeLimitSec: 60 },
  },
  {
    id: "reveal-rush",
    label: "리빌 러시",
    description: "빨리 맞힐수록 고득점",
    fullDex: false,
    rule: { mode: "reveal-rush", questionCount: 12, revealSec: 6 },
  },
  bingoMode(3),
  bingoMode(5),
  {
    id: "gender",
    label: "암수 구별",
    description: "앞뒤 모습으로 암컷·수컷 맞히기",
    // Only ~100 species across every generation look different by gender, so
    // this needs the whole dex rather than any one generation's pool.
    fullDex: true,
    rule: { mode: "gender", questionCount: 10 },
  },
];

export function getMode(id: string): ModeDef | undefined {
  return MODES.find((m) => m.id === id);
}

/** A pool with no constraint at all — the whole dex. */
function isFullDex(filter: PoolFilter): boolean {
  return !filter.generations?.length && !filter.types?.length;
}

/** The modes a pool can actually offer (see `ModeDef.fullDex`). */
export function modesForPool(poolId: string): ModeDef[] {
  const pool = getPool(poolId);
  if (!pool) return [];
  return MODES.filter((m) => m.fullDex === isFullDex(pool.filter));
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
 * unknown or not-yet-available (coming-soon) pool, so locked pools can't be
 * played — and for a mode this pool doesn't offer, so a hand-typed URL like
 * `gen1:bingo-3` (one generation, no row axis) can't start either. */
export function getChallenge(id: string): ChallengeDef | undefined {
  const [poolId, modeId] = id.split(":");
  const pool = getPool(poolId);
  const mode = getMode(modeId);
  if (!pool || !mode || pool.unlock.kind === "comingSoon") return undefined;
  if (mode.fullDex !== isFullDex(pool.filter)) return undefined;
  return {
    id,
    title: `${pool.label} · ${mode.label}`,
    rule: { ...mode.rule, pool: pool.filter },
  };
}
