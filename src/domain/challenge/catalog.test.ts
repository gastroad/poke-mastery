import { describe, expect, it } from "vitest";
import { challengeId, getChallenge, getMode, getPool, MODES, POOLS } from "./catalog";

describe("pools", () => {
  it("has Gen 1 open and later generations coming soon", () => {
    expect(getPool("gen1")?.unlock).toEqual({ kind: "always" });
    expect(getPool("gen2")?.unlock).toEqual({ kind: "comingSoon" });
    expect(getPool("type-fire")?.unlock).toEqual({ kind: "comingSoon" });
  });

  it("has unique ids", () => {
    const ids = POOLS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("modes", () => {
  it("ships the three formats", () => {
    expect(MODES.map((m) => m.id)).toEqual(["quiz", "time-attack", "reveal-rush"]);
    expect(getMode("time-attack")?.rule.timeLimitSec).toBe(60);
  });
});

describe("getChallenge", () => {
  it("composes a pool × mode into a playable challenge", () => {
    const c = getChallenge("gen1:quiz");
    expect(c?.rule.mode).toBe("quiz");
    expect(c?.rule.pool).toEqual({ generations: [1] });
    expect(c?.rule.questionCount).toBe(10);
    expect(c?.title).toContain("1세대");
  });

  it("carries mode params (time-attack clock)", () => {
    expect(getChallenge("gen1:time-attack")?.rule.timeLimitSec).toBe(60);
  });

  it("returns undefined for a coming-soon pool", () => {
    expect(getChallenge("gen2:quiz")).toBeUndefined();
    expect(getChallenge("type-fire:quiz")).toBeUndefined();
  });

  it("returns undefined for an unknown pool or mode", () => {
    expect(getChallenge("nope:quiz")).toBeUndefined();
    expect(getChallenge("gen1:nope")).toBeUndefined();
  });
});

describe("challengeId", () => {
  it("joins pool and mode", () => {
    expect(challengeId("gen1", "reveal-rush")).toBe("gen1:reveal-rush");
    expect(getChallenge(challengeId("gen1", "quiz"))?.rule.mode).toBe("quiz");
  });
});
