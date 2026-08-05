import { describe, expect, it } from "vitest";
import {
  challengeId,
  getChallenge,
  getMode,
  getPool,
  MODES,
  modesForPool,
  POOLS,
} from "./catalog";

describe("pools", () => {
  it("has Gen 1 open and later generations coming soon", () => {
    expect(getPool("gen1")?.unlock).toEqual({ kind: "always" });
    expect(getPool("gen2")?.unlock).toEqual({ kind: "comingSoon" });
    expect(getPool("type-fire")?.unlock).toEqual({ kind: "comingSoon" });
  });

  it("opens the full-dex pool, since bingo needs every generation", () => {
    expect(getPool("all")?.unlock).toEqual({ kind: "always" });
  });

  it("has unique ids", () => {
    const ids = POOLS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("modes", () => {
  it("ships the silhouette formats plus both bingo sizes", () => {
    expect(MODES.map((m) => m.id)).toEqual([
      "quiz",
      "time-attack",
      "reveal-rush",
      "bingo-3",
      "bingo-5",
      "gender",
    ]);
    expect(getMode("time-attack")?.rule.timeLimitSec).toBe(60);
  });

  it("has unique ids", () => {
    const ids = MODES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives bingo a board, a cell threshold and a whole-board attempt budget", () => {
    const rule = getMode("bingo-3")?.rule;
    expect(rule?.mode).toBe("bingo");
    expect(rule?.boardSize).toBe(3);
    expect(rule?.minAnswersPerCell).toBeGreaterThan(0);
    expect(rule?.attempts).toBe(13); // 9 cells + half again
    expect(getMode("bingo-5")?.rule.attempts).toBe(37);
  });
});

describe("modesForPool", () => {
  it("offers only the silhouette modes on a single generation", () => {
    expect(modesForPool("gen1").map((m) => m.id)).toEqual([
      "quiz",
      "time-attack",
      "reveal-rush",
    ]);
  });

  it("offers only the full-dex modes on the full dex", () => {
    expect(modesForPool("all").map((m) => m.id)).toEqual(["bingo-3", "bingo-5", "gender"]);
  });

  it("keeps bingo off type pools — a type pool would collapse the column axis", () => {
    expect(modesForPool("type-fire").map((m) => m.id)).not.toContain("bingo-3");
  });

  it("is empty for an unknown pool", () => {
    expect(modesForPool("nope")).toEqual([]);
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

  it("composes a bingo challenge on the full-dex pool", () => {
    const c = getChallenge("all:bingo-3");
    expect(c?.rule.mode).toBe("bingo");
    expect(c?.rule.pool).toEqual({});
    expect(c?.rule.boardSize).toBe(3);
    expect(c?.title).toContain("빙고");
  });

  it("refuses bingo on a single generation — one row axis value is no board", () => {
    expect(getChallenge("gen1:bingo-3")).toBeUndefined();
  });

  it("refuses a silhouette mode on the full dex (artwork is gen 1 only)", () => {
    expect(getChallenge("all:quiz")).toBeUndefined();
  });
});

describe("challengeId", () => {
  it("joins pool and mode", () => {
    expect(challengeId("gen1", "reveal-rush")).toBe("gen1:reveal-rush");
    expect(getChallenge(challengeId("gen1", "quiz"))?.rule.mode).toBe("quiz");
  });
});
