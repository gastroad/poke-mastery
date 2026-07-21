import { describe, expect, it } from "vitest";
import { applyPlayResult, EMPTY_PROGRESS } from "./applyPlayResult";
import type { PlayOutcome } from "./types";

const outcome: PlayOutcome = [
  { types: ["grass", "poison"], correct: true },
  { types: ["fire"], correct: true },
  { types: ["water"], correct: false },
];

describe("applyPlayResult", () => {
  it("adds score as XP and folds in type stats", () => {
    const { progress, delta } = applyPlayResult(EMPTY_PROGRESS, outcome);
    // score: 100 + 120 (combo) + 0 (wrong) = 220
    expect(delta.score).toBe(220);
    expect(delta.xpGained).toBe(220);
    expect(progress.totalXp).toBe(220);
    expect(progress.typeStats.grass).toEqual({ seen: 1, correct: 1 });
    expect(progress.typeStats.water).toEqual({ seen: 1, correct: 0 });
  });

  it("reports a level-up when the threshold is crossed", () => {
    const { delta } = applyPlayResult({ totalXp: 250, typeStats: {} }, outcome);
    // 250 (L1) -> 470 (L2, since 300 clears level 1)
    expect(delta.levelBefore).toBe(1);
    expect(delta.levelAfter).toBe(2);
    expect(delta.leveledUp).toBe(true);
  });

  it("reports no level-up when staying within a level", () => {
    const { delta } = applyPlayResult(EMPTY_PROGRESS, [{ types: ["fire"], correct: true }]);
    expect(delta.leveledUp).toBe(false);
  });

  it("does not mutate the input progress", () => {
    const input = { totalXp: 100, typeStats: { fire: { seen: 1, correct: 1 } } };
    applyPlayResult(input, outcome);
    expect(input.totalXp).toBe(100);
    expect(input.typeStats.fire).toEqual({ seen: 1, correct: 1 });
  });
});
