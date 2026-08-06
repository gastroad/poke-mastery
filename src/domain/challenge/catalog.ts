import type { PokemonType } from "../pokemon/types";
import { TYPE_NAME_KO } from "../pokemon/typeNames";
import type { ClearGoal, ClearGoals } from "./clear";
import type { ChallengeRule, PoolFilter } from "./types";
import type { UnlockCondition } from "./unlock";

/**
 * A challenge is composed on the fly from a POOL (what Pokémon) × a MODE (how to
 * play) × a DIFFICULTY (how hard). The id is `${poolId}:${modeId}:${difficultyId}`.
 * Pools gate availability (e.g. later generations are "coming soon" until their
 * data is synced); every mode is available for an open pool.
 *
 * The player picks the MODE first — it's the identity of the game ("I want to
 * play bingo"), while pool and difficulty are settings on it. So availability
 * flows mode → pools (`poolsForMode`), not the other way round.
 */

// ── Pools: the "what" ──
export interface PoolDef {
  id: string;
  label: string;
  filter: PoolFilter;
  unlock: UnlockCondition;
}

/** All nine generations are synced, so every pool is open. */
export const GENERATION_POOLS: PoolDef[] = [
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map(
    (n): PoolDef => ({
      id: `gen${n}`,
      label: `${n}세대`,
      filter: { generations: [n] },
      unlock: { kind: "always" },
    }),
  ),
  { id: "all", label: "전세대", filter: {}, unlock: { kind: "always" } },
];

export const TYPE_POOLS: PoolDef[] = (Object.keys(TYPE_NAME_KO) as PokemonType[]).map((type) => ({
  id: `type-${type}`,
  label: `${TYPE_NAME_KO[type]} 타입`,
  filter: { types: [type] },
  unlock: { kind: "always" },
}));

export const POOLS: PoolDef[] = [...GENERATION_POOLS, ...TYPE_POOLS];

export function getPool(id: string): PoolDef | undefined {
  return POOLS.find((p) => p.id === id);
}

// ── Difficulties: the "how hard" ──
export interface DifficultyDef {
  /** Unique within its mode — the third segment of a challenge id. */
  id: string;
  /**
   * Shown verbatim on the picker. Deliberately the VALUE ("60초", "5×5") rather
   * than 쉬움/보통/어려움: for the modes whose only knob is question count, the
   * ladder really is length, and naming it "어려움" would be a lie. Once a real
   * difficulty knob exists (initial-consonant hints, distorted silhouettes),
   * those modes get a second axis and can rename their levels honestly.
   */
  label: string;
  /** Overrides merged onto the mode's base rule. */
  rule: Partial<Omit<ChallengeRule, "mode" | "pool">>;
  /**
   * The bar for "cleared" and the ceiling for "perfect". These live on the
   * DIFFICULTY, not the mode: 30초 타임어택 and 90초 타임어택 cannot possibly ask
   * for the same number of Pokémon, and neither can a 3×3 and a 5×5 board.
   */
  clear: ClearGoal;
  perfect: ClearGoal;
}

/** Perfect for anything scored by question: every planned question answered right. */
const ALL_CORRECT: ClearGoal = { kind: "accuracy", min: 1 };

/** Reveal-rush is typed free-form, so the same bar holds at every reveal speed. */
const RUSH_CLEAR: ClearGoal = { kind: "accuracy", min: 0.7 };

/**
 * Length ladder, shared by the modes whose only knob is how many questions.
 *
 * `clearAccuracy` is a parameter rather than a constant because a two-choice
 * quiz has to ask for more: guessing blindly already scores 50% in 무게 대결 and
 * 암수 구별, so a 70% bar would sit uncomfortably close to luck.
 */
const countLadder = (clearAccuracy: number): DifficultyDef[] =>
  [5, 10, 20].map((n) => ({
    id: `n${n}`,
    label: `${n}문제`,
    rule: { questionCount: n },
    clear: { kind: "accuracy", min: clearAccuracy } as ClearGoal,
    perfect: ALL_CORRECT,
  }));

// ── Modes: the "how" ──
export interface ModeDef {
  /** Not the same thing as `rule.mode`: two modes could share a session format. */
  id: string;
  label: string;
  description: string;
  /**
   * Whether the mode only works on the unfiltered dex. Bingo does — its rows are
   * generations and its columns are types, so any pool filter would collapse an
   * axis — and so does the gender quiz, which draws on ~100 species scattered
   * across every generation. Everything else plays fine against any pool.
   */
  fullDexOnly: boolean;
  /** Ordered easiest → hardest. Never empty; every mode has at least two levels. */
  difficulties: DifficultyDef[];
  /** Which level a player gets when they don't pick one. Must exist in `difficulties`. */
  defaultDifficultyId: string;
  /** The mode's base rule params (pool and difficulty are merged in per selection). */
  rule: Omit<ChallengeRule, "pool">;
}

/** Bingo attempts for the whole board: one per cell, plus half again as slack. */
const bingoAttempts = (size: number) => size * size + Math.floor((size * size) / 2);

/** A bingo board size. It's the mode's difficulty axis, not a mode of its own. */
const bingoSize = (size: number, clearLines: number): DifficultyDef => ({
  id: `${size}x${size}`,
  label: `${size}×${size}`,
  // Every cell is one thing to answer, which is what questionCount means here.
  rule: { questionCount: size * size, boardSize: size, attempts: bingoAttempts(size) },
  // Bingo is won by lines, not by accuracy — filling eight scattered cells is
  // not the same achievement as filling three that line up.
  clear: { kind: "bingoLines", min: clearLines },
  // For bingo, "every planned question correct" IS the full board: the grader
  // reports one outcome per cell.
  perfect: ALL_CORRECT,
});

export const MODES: ModeDef[] = [
  {
    id: "quiz",
    label: "실루엣",
    description: "실루엣만 보고 이름 맞히기",
    fullDexOnly: false,
    difficulties: countLadder(0.7),
    defaultDifficultyId: "n10",
    rule: { mode: "quiz", questionCount: 10 },
  },
  {
    id: "time-attack",
    label: "타임어택",
    description: "제한 시간 안에 최대한 많이",
    fullDexOnly: false,
    // Accuracy means nothing here — the question budget is effectively endless,
    // so the target is a headcount, and it scales with the clock.
    difficulties: [
      {
        id: "90s",
        label: "90초",
        rule: { timeLimitSec: 90 },
        clear: { kind: "correctCount", min: 22 },
        perfect: { kind: "noMistakes" },
      },
      {
        id: "60s",
        label: "60초",
        rule: { timeLimitSec: 60 },
        clear: { kind: "correctCount", min: 15 },
        perfect: { kind: "noMistakes" },
      },
      {
        id: "30s",
        label: "30초",
        rule: { timeLimitSec: 30 },
        clear: { kind: "correctCount", min: 8 },
        perfect: { kind: "noMistakes" },
      },
    ],
    defaultDifficultyId: "60s",
    // large count so the pool never runs out before the clock (capped at pool size)
    rule: { mode: "time-attack", questionCount: 1000, timeLimitSec: 60 },
  },
  {
    id: "reveal-rush",
    label: "리빌 러시",
    description: "빨리 맞힐수록 고득점",
    fullDexOnly: false,
    // Shorter reveal = less of the silhouette before you must commit = harder.
    difficulties: [
      { id: "10s", label: "10초", rule: { revealSec: 10 }, clear: RUSH_CLEAR, perfect: ALL_CORRECT },
      { id: "6s", label: "6초", rule: { revealSec: 6 }, clear: RUSH_CLEAR, perfect: ALL_CORRECT },
      { id: "4s", label: "4초", rule: { revealSec: 4 }, clear: RUSH_CLEAR, perfect: ALL_CORRECT },
    ],
    defaultDifficultyId: "6s",
    rule: { mode: "reveal-rush", questionCount: 12, revealSec: 6 },
  },
  {
    id: "bingo",
    label: "빙고",
    description: "세대 × 타입 판 채우기",
    fullDexOnly: true,
    difficulties: [bingoSize(3, 1), bingoSize(5, 2)],
    defaultDifficultyId: "3x3",
    rule: {
      mode: "bingo",
      questionCount: 9,
      boardSize: 3,
      minAnswersPerCell: 5,
      attempts: bingoAttempts(3),
    },
  },
  {
    id: "heavier",
    label: "무게 대결",
    description: "둘 중 더 무거운 쪽 고르기",
    fullDexOnly: false,
    difficulties: countLadder(0.8),
    defaultDifficultyId: "n10",
    rule: { mode: "heavier", questionCount: 10 },
  },
  {
    id: "gender",
    label: "암수 구별",
    description: "앞뒤 모습으로 암컷·수컷 맞히기",
    // Only ~100 species across every generation look different by gender, so
    // this needs the whole dex rather than any one generation's pool.
    fullDexOnly: true,
    difficulties: countLadder(0.8),
    defaultDifficultyId: "n10",
    rule: { mode: "gender", questionCount: 10 },
  },
];

export function getMode(id: string): ModeDef | undefined {
  return MODES.find((m) => m.id === id);
}

/** A mode's level by id. Strict — see `resolveDifficultyId` for the lenient form. */
export function getDifficulty(modeId: string, difficultyId: string): DifficultyDef | undefined {
  return getMode(modeId)?.difficulties.find((d) => d.id === difficultyId);
}

/**
 * The level to actually play when the URL asked for none (or for a level that
 * no longer exists). Lives here — and NOT inside `getChallenge` — so that every
 * id which reaches the grader is canonical: a stale `?d=` is repaired once, at
 * the route, rather than silently re-grading a stored record under whatever the
 * default happens to be later.
 */
export function resolveDifficultyId(modeId: string, difficultyId?: string): string | undefined {
  const mode = getMode(modeId);
  if (!mode) return undefined;
  return difficultyId && mode.difficulties.some((d) => d.id === difficultyId)
    ? difficultyId
    : mode.defaultDifficultyId;
}

/** A pool with no constraint at all — the whole dex. */
function isFullDex(filter: PoolFilter): boolean {
  return !filter.generations?.length && !filter.types?.length;
}

/** The pool every mode can play, and the fallback when the URL names none. */
export const DEFAULT_POOL_ID = "all";

/**
 * The pools a mode can actually be played on (see `ModeDef.fullDexOnly`). This
 * is the direction the picker asks in: mode first, then which Pokémon. A
 * full-dex-only mode narrows to a single choice rather than disappearing —
 * which is how bingo used to become invisible the moment you picked 1세대.
 */
export function poolsForMode(modeId: string): PoolDef[] {
  const mode = getMode(modeId);
  if (!mode) return [];
  const open = POOLS.filter((p) => p.unlock.kind !== "comingSoon");
  return mode.fullDexOnly ? open.filter((p) => isFullDex(p.filter)) : open;
}

// ── Challenge = pool × mode × difficulty ──
export interface ChallengeDef {
  id: string;
  title: string;
  rule: ChallengeRule;
  /** What this exact combination asks of you (see domain/challenge/clear). */
  goals: ClearGoals;
}

export function challengeId(poolId: string, modeId: string, difficultyId: string): string {
  return `${poolId}:${modeId}:${difficultyId}`;
}

/** Split a challenge id back into its parts. Undefined if it isn't one. */
export function parseChallengeId(
  id: string,
): { poolId: string; modeId: string; difficultyId: string } | undefined {
  const [poolId, modeId, difficultyId, ...rest] = id.split(":");
  if (!poolId || !modeId || !difficultyId || rest.length > 0) return undefined;
  return { poolId, modeId, difficultyId };
}

/** Build a playable challenge from its `poolId:modeId:difficultyId`. Returns
 * undefined for an unknown or not-yet-available (coming-soon) pool, so locked
 * pools can't be played — for a pool this mode doesn't offer, so a hand-typed
 * `gen1:bingo:3x3` (one generation, no row axis) can't start either — and for a
 * level this mode doesn't define, so a stored id always means one exact rule. */
export function getChallenge(id: string): ChallengeDef | undefined {
  const [poolId, modeId, difficultyId] = id.split(":");
  const pool = getPool(poolId);
  const mode = getMode(modeId);
  if (!pool || !mode || pool.unlock.kind === "comingSoon") return undefined;
  if (mode.fullDexOnly && !isFullDex(pool.filter)) return undefined;

  const difficulty = mode.difficulties.find((d) => d.id === difficultyId);
  if (!difficulty) return undefined;

  return {
    id,
    title: `${pool.label} · ${mode.label} · ${difficulty.label}`,
    // Difficulty overrides the mode's base params — order matters.
    rule: { ...mode.rule, ...difficulty.rule, pool: pool.filter },
    goals: { clear: difficulty.clear, perfect: difficulty.perfect },
  };
}
