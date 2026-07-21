import { describe, expect, it } from "vitest";
import { computeScore, SCORE_BASE, SCORE_COMBO_STEP } from "./score";

describe("computeScore", () => {
  it("scores an empty game as 0", () => {
    expect(computeScore([])).toBe(0);
  });

  it("scores a single correct answer as BASE", () => {
    expect(computeScore([true])).toBe(SCORE_BASE);
  });

  it("rewards consecutive correct answers with a growing combo bonus", () => {
    // 100 + (100+20) + (100+40) = 360
    expect(computeScore([true, true, true])).toBe(360);
  });

  it("resets the combo after a wrong answer", () => {
    // 100 + 120, wrong resets, then 100 again = 320
    expect(computeScore([true, true, false, true])).toBe(320);
  });

  it("scores an all-wrong game as 0", () => {
    expect(computeScore([false, false])).toBe(0);
  });

  it("uses the combo-step constant", () => {
    expect(computeScore([true, true])).toBe(SCORE_BASE * 2 + SCORE_COMBO_STEP);
  });
});
