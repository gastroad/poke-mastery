import { describe, expect, it } from "vitest";
import { getMode, MODES } from "../challenge/catalog";
import type { ChallengeRecord } from "../progress/challengeRecord";
import { BADGES } from "./catalog";
import { earnedBadges, meetsCondition, newlyEarnedBadges } from "./judgeBadges";
import type { BadgeState } from "./types";

const rec = (over: Partial<ChallengeRecord> = {}): ChallengeRecord => ({
  bestScore: 500,
  cleared: true,
  perfect: false,
  playCount: 1,
  ...over,
});

const state = (
  records: Record<string, ChallengeRecord>,
  totalXp = 0,
): BadgeState => ({ records, progress: { totalXp, typeStats: {} } });

describe("badge catalog", () => {
  it("has unique ids", () => {
    const ids = BADGES.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every game a badge and a mastery badge", () => {
    for (const mode of MODES) {
      expect(BADGES.map((b) => b.id)).toContain(`gym-${mode.id}`);
      expect(BADGES.map((b) => b.id)).toContain(`master-${mode.id}`);
    }
  });

  it("awards nothing to a player who has never played", () => {
    expect(earnedBadges(state({}))).toEqual([]);
  });
});

describe("clearMode", () => {
  const condition = { kind: "clearMode", modeId: "quiz" } as const;

  it("accepts a clear on any pool or difficulty", () => {
    expect(meetsCondition(condition, state({ "type-fire:quiz:n20": rec() }))).toBe(true);
  });

  it("ignores an unfinished attempt", () => {
    expect(meetsCondition(condition, state({ "gen1:quiz:n10": rec({ cleared: false }) }))).toBe(
      false,
    );
  });

  it("does not count another game's clear", () => {
    expect(meetsCondition(condition, state({ "gen1:heavier:n10": rec() }))).toBe(false);
  });
});

describe("clearEveryDifficulty", () => {
  const condition = { kind: "clearEveryDifficulty", modeId: "quiz" } as const;
  const levels = getMode("quiz")!.difficulties.map((d) => d.id);

  it("needs every level of that game", () => {
    const partial = Object.fromEntries(levels.slice(0, -1).map((d) => [`gen1:quiz:${d}`, rec()]));
    expect(meetsCondition(condition, state(partial))).toBe(false);

    const all = Object.fromEntries(levels.map((d) => [`gen1:quiz:${d}`, rec()]));
    expect(meetsCondition(condition, state(all))).toBe(true);
  });

  it("lets the levels be cleared on different pools", () => {
    const spread = Object.fromEntries(
      levels.map((d, i) => [`${["gen1", "gen5", "type-fire"][i % 3]}:quiz:${d}`, rec()]),
    );
    expect(meetsCondition(condition, state(spread))).toBe(true);
  });

  it("is false for an unknown mode", () => {
    expect(meetsCondition({ kind: "clearEveryDifficulty", modeId: "nope" }, state({}))).toBe(false);
  });
});

describe("counting conditions", () => {
  const three = {
    "gen1:quiz:n10": rec(),
    "gen2:quiz:n10": rec({ perfect: true }),
    "gen3:quiz:n10": rec({ perfect: true }),
  };

  it("counts distinct cleared challenges", () => {
    expect(meetsCondition({ kind: "clearCount", min: 3 }, state(three))).toBe(true);
    expect(meetsCondition({ kind: "clearCount", min: 4 }, state(three))).toBe(false);
  });

  it("counts distinct perfected challenges", () => {
    expect(meetsCondition({ kind: "perfectCount", min: 2 }, state(three))).toBe(true);
    expect(meetsCondition({ kind: "perfectCount", min: 3 }, state(three))).toBe(false);
  });
});

describe("clearEveryMode", () => {
  it("needs one clear in each game there is", () => {
    const all = Object.fromEntries(MODES.map((m) => [`all:${m.id}:${m.defaultDifficultyId}`, rec()]));
    expect(meetsCondition({ kind: "clearEveryMode" }, state(all))).toBe(true);

    const missingOne = { ...all };
    delete missingOne[`all:${MODES[0].id}:${MODES[0].defaultDifficultyId}`];
    expect(meetsCondition({ kind: "clearEveryMode" }, state(missingOne))).toBe(false);
  });
});

describe("level", () => {
  it("reads the level off total XP", () => {
    expect(meetsCondition({ kind: "level", min: 2 }, state({}, 0))).toBe(false);
    expect(meetsCondition({ kind: "level", min: 2 }, state({}, 100_000))).toBe(true);
  });
});

describe("newlyEarnedBadges", () => {
  const played = state({ "gen1:quiz:n10": rec() });

  it("reports only what wasn't already held", () => {
    const all = earnedBadges(played);
    expect(all).toContain("gym-quiz");
    expect(all).toContain("first-clear");

    expect(newlyEarnedBadges(played, ["gym-quiz"])).not.toContain("gym-quiz");
    expect(newlyEarnedBadges(played, ["gym-quiz"])).toContain("first-clear");
    expect(newlyEarnedBadges(played, all)).toEqual([]);
  });

  it("keeps a badge the player holds but no longer qualifies for", () => {
    // Nothing cleared any more, but the badge was already awarded — it is not
    // re-announced, and the caller never removes it.
    expect(newlyEarnedBadges(state({}), ["gym-quiz"])).toEqual([]);
  });
});
