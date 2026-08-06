import { describe, expect, it } from "vitest";
import {
  challengeId,
  getChallenge,
  getDifficulty,
  getMode,
  getPool,
  MODES,
  poolsForMode,
  POOLS,
  resolveDifficultyId,
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
  it("ships every format, with bingo as one mode rather than one per size", () => {
    expect(MODES.map((m) => m.id)).toEqual([
      "quiz",
      "time-attack",
      "reveal-rush",
      "bingo",
      "heavier",
      "gender",
    ]);
  });

  it("has unique ids", () => {
    const ids = MODES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every mode a choice of levels, with a default among them", () => {
    for (const mode of MODES) {
      expect(mode.difficulties.length).toBeGreaterThan(1);
      const ids = mode.difficulties.map((d) => d.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids).toContain(mode.defaultDifficultyId);
    }
  });

  it("gives every level both a clear bar and a perfect ceiling", () => {
    for (const mode of MODES) {
      for (const d of mode.difficulties) {
        expect(d.clear, `${mode.id}:${d.id}`).toBeDefined();
        expect(d.perfect, `${mode.id}:${d.id}`).toBeDefined();
      }
    }
  });

  it("asks more of the two-choice modes, where guessing already scores 50%", () => {
    for (const modeId of ["heavier", "gender"]) {
      for (const d of getMode(modeId)!.difficulties) {
        expect(d.clear).toEqual({ kind: "accuracy", min: 0.8 });
      }
    }
    for (const d of getMode("quiz")!.difficulties) {
      expect(d.clear).toEqual({ kind: "accuracy", min: 0.7 });
    }
  });

  it("scales the time-attack target with the clock", () => {
    const byId = Object.fromEntries(
      getMode("time-attack")!.difficulties.map((d) => [d.id, d.clear]),
    );
    expect(byId["90s"]).toEqual({ kind: "correctCount", min: 22 });
    expect(byId["60s"]).toEqual({ kind: "correctCount", min: 15 });
    expect(byId["30s"]).toEqual({ kind: "correctCount", min: 8 });
  });

  it("wins bingo by lines, and calls a full board perfect", () => {
    const [small, big] = getMode("bingo")!.difficulties;
    expect(small.clear).toEqual({ kind: "bingoLines", min: 1 });
    expect(big.clear).toEqual({ kind: "bingoLines", min: 2 });
    expect(big.perfect).toEqual({ kind: "accuracy", min: 1 });
  });
});

describe("getDifficulty", () => {
  it("finds a level within its mode", () => {
    expect(getDifficulty("time-attack", "30s")?.rule.timeLimitSec).toBe(30);
    expect(getDifficulty("bingo", "5x5")?.rule.boardSize).toBe(5);
  });

  it("is strict — a level from another mode isn't borrowed", () => {
    expect(getDifficulty("quiz", "30s")).toBeUndefined();
    expect(getDifficulty("nope", "n10")).toBeUndefined();
  });
});

describe("resolveDifficultyId", () => {
  it("keeps a level the mode defines", () => {
    expect(resolveDifficultyId("time-attack", "30s")).toBe("30s");
  });

  it("falls back to the mode default when absent or stale", () => {
    expect(resolveDifficultyId("time-attack")).toBe("60s");
    expect(resolveDifficultyId("time-attack", "bogus")).toBe("60s");
    expect(resolveDifficultyId("quiz", "30s")).toBe("n10");
  });

  it("is undefined for an unknown mode", () => {
    expect(resolveDifficultyId("nope")).toBeUndefined();
  });
});

describe("poolsForMode", () => {
  it("offers every pool to a mode that can be filtered", () => {
    expect(poolsForMode("quiz").map((p) => p.id)).toEqual(POOLS.map((p) => p.id));
  });

  it("narrows a full-dex-only mode to the whole dex instead of hiding it", () => {
    expect(poolsForMode("bingo").map((p) => p.id)).toEqual(["all"]);
    expect(poolsForMode("gender").map((p) => p.id)).toEqual(["all"]);
  });

  it("is empty for an unknown mode", () => {
    expect(poolsForMode("nope")).toEqual([]);
  });
});

describe("getChallenge", () => {
  it("composes a pool × mode × difficulty into a playable challenge", () => {
    const c = getChallenge("gen1:quiz:n10");
    expect(c?.rule.mode).toBe("quiz");
    expect(c?.rule.pool).toEqual({ generations: [1] });
    expect(c?.rule.questionCount).toBe(10);
    expect(c?.title).toContain("1세대");
  });

  it("lets difficulty override the mode's base params", () => {
    expect(getChallenge("gen1:quiz:n20")?.rule.questionCount).toBe(20);
    expect(getChallenge("gen1:time-attack:90s")?.rule.timeLimitSec).toBe(90);
    expect(getChallenge("gen1:reveal-rush:4s")?.rule.revealSec).toBe(4);
  });

  it("keeps the mode params the difficulty doesn't touch", () => {
    // The clock changes; the endless question budget doesn't.
    expect(getChallenge("gen1:time-attack:30s")?.rule.questionCount).toBe(1000);
  });

  it("plays the silhouette quiz on any generation, now that all are synced", () => {
    expect(getChallenge("gen5:quiz:n10")?.rule.pool).toEqual({ generations: [5] });
    expect(getChallenge("type-fire:quiz:n10")?.rule.pool).toEqual({ types: ["fire"] });
    expect(getChallenge("all:quiz:n10")?.rule.pool).toEqual({});
  });

  it("returns undefined for an unknown pool, mode or difficulty", () => {
    expect(getChallenge("nope:quiz:n10")).toBeUndefined();
    expect(getChallenge("gen1:nope:n10")).toBeUndefined();
    expect(getChallenge("gen1:quiz:nope")).toBeUndefined();
  });

  it("refuses a two-segment id — a stored rule must name its difficulty", () => {
    expect(getChallenge("gen1:quiz")).toBeUndefined();
  });

  it("sizes the bingo board from the difficulty", () => {
    const small = getChallenge("all:bingo:3x3");
    expect(small?.rule.mode).toBe("bingo");
    expect(small?.rule.pool).toEqual({});
    expect(small?.rule.boardSize).toBe(3);
    expect(small?.rule.questionCount).toBe(9);
    expect(small?.rule.attempts).toBe(13); // 9 cells + half again
    expect(small?.rule.minAnswersPerCell).toBeGreaterThan(0);
    expect(small?.title).toContain("빙고");

    const big = getChallenge("all:bingo:5x5");
    expect(big?.rule.boardSize).toBe(5);
    expect(big?.rule.questionCount).toBe(25);
    expect(big?.rule.attempts).toBe(37);
  });

  it("refuses bingo on a single generation — one row axis value is no board", () => {
    expect(getChallenge("gen1:bingo:3x3")).toBeUndefined();
  });

  it("refuses the gender quiz on a single generation", () => {
    expect(getChallenge("gen1:gender:n10")).toBeUndefined();
  });
});

describe("challengeId", () => {
  it("joins pool, mode and difficulty", () => {
    expect(challengeId("gen1", "reveal-rush", "6s")).toBe("gen1:reveal-rush:6s");
    expect(getChallenge(challengeId("gen1", "quiz", "n10"))?.rule.mode).toBe("quiz");
  });

  it("round-trips every mode on its default level and first pool", () => {
    for (const mode of MODES) {
      const pool = poolsForMode(mode.id)[0];
      const id = challengeId(pool.id, mode.id, mode.defaultDifficultyId);
      expect(getChallenge(id), id).toBeDefined();
    }
  });
});
