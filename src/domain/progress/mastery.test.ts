import { describe, expect, it } from "vitest";
import { applyOutcomeToStats, isTypeMastered, masteryPct, MASTERY_MIN_SEEN } from "./mastery";
import type { PlayOutcome, Progress } from "./types";

describe("masteryPct", () => {
  it("is 0 for an unseen type", () => {
    expect(masteryPct(undefined)).toBe(0);
    expect(masteryPct({ seen: 0, correct: 0 })).toBe(0);
  });

  it("is rounded accuracy", () => {
    expect(masteryPct({ seen: 4, correct: 3 })).toBe(75);
    expect(masteryPct({ seen: 3, correct: 1 })).toBe(33);
  });
});

describe("isTypeMastered", () => {
  it("requires minimum exposure regardless of accuracy", () => {
    expect(isTypeMastered({ seen: MASTERY_MIN_SEEN - 1, correct: MASTERY_MIN_SEEN - 1 }, 80)).toBe(false);
  });

  it("passes when exposure and accuracy both clear the bar", () => {
    expect(isTypeMastered({ seen: 10, correct: 9 }, 80)).toBe(true);
  });

  it("fails when accuracy is below the bar", () => {
    expect(isTypeMastered({ seen: 20, correct: 10 }, 80)).toBe(false);
  });
});

describe("applyOutcomeToStats", () => {
  it("accumulates seen/correct per type, counting both types of a dual-type", () => {
    const outcome: PlayOutcome = [
      { types: ["grass", "poison"], correct: true },
      { types: ["fire"], correct: false },
      { types: ["grass"], correct: true },
    ];
    const stats = applyOutcomeToStats({}, outcome);
    expect(stats.grass).toEqual({ seen: 2, correct: 2 });
    expect(stats.poison).toEqual({ seen: 1, correct: 1 });
    expect(stats.fire).toEqual({ seen: 1, correct: 0 });
  });

  it("adds onto existing stats without mutating the input", () => {
    const before: Progress["typeStats"] = { fire: { seen: 5, correct: 3 } };
    const after = applyOutcomeToStats(before, [{ types: ["fire"], correct: true }]);
    expect(after.fire).toEqual({ seen: 6, correct: 4 });
    expect(before.fire).toEqual({ seen: 5, correct: 3 }); // unchanged
  });
});
