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
  it("is fully open now that every generation is synced", () => {
    for (const id of ["gen1", "gen5", "gen9", "all", "type-fire"]) {
      expect(getPool(id)?.unlock).toEqual({ kind: "always" });
    }
  });

  it("has unique ids", () => {
    const ids = POOLS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("modes", () => {
  it("ships every format", () => {
    expect(MODES.map((m) => m.id)).toEqual([
      "quiz",
      "time-attack",
      "reveal-rush",
      "bingo-3",
      "bingo-5",
      "heavier",
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
  it("hides the full-dex-only modes from a single generation", () => {
    const ids = modesForPool("gen1").map((m) => m.id);
    expect(ids).toContain("quiz");
    expect(ids).not.toContain("bingo-3");
    expect(ids).not.toContain("gender");
  });

  it("offers everything on the full dex", () => {
    expect(modesForPool("all").map((m) => m.id)).toEqual(MODES.map((m) => m.id));
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

  it("plays the silhouette quiz on any generation, now that all are synced", () => {
    expect(getChallenge("gen5:quiz")?.rule.pool).toEqual({ generations: [5] });
    expect(getChallenge("type-fire:quiz")?.rule.pool).toEqual({ types: ["fire"] });
    expect(getChallenge("all:quiz")?.rule.pool).toEqual({});
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

  it("refuses the gender quiz on a single generation", () => {
    expect(getChallenge("gen1:gender")).toBeUndefined();
  });
});

describe("challengeId", () => {
  it("joins pool and mode", () => {
    expect(challengeId("gen1", "reveal-rush")).toBe("gen1:reveal-rush");
    expect(getChallenge(challengeId("gen1", "quiz"))?.rule.mode).toBe("quiz");
  });
});
