import { describe, expect, it } from "vitest";
import { LEVEL_BASE, resolveLevel, xpToAdvance } from "./level";

describe("xpToAdvance", () => {
  it("ramps linearly per level", () => {
    expect(xpToAdvance(1)).toBe(300);
    expect(xpToAdvance(2)).toBe(500);
    expect(xpToAdvance(3)).toBe(700);
  });
});

describe("resolveLevel", () => {
  it("starts at level 1 with 0 XP", () => {
    expect(resolveLevel(0)).toEqual({ level: 1, xpIntoLevel: 0, xpForNext: 300 });
  });

  it("stays level 1 just below the threshold", () => {
    expect(resolveLevel(LEVEL_BASE - 1)).toEqual({ level: 1, xpIntoLevel: 299, xpForNext: 300 });
  });

  it("reaches level 2 exactly at the threshold", () => {
    expect(resolveLevel(300)).toEqual({ level: 2, xpIntoLevel: 0, xpForNext: 500 });
  });

  it("tracks XP within a higher level", () => {
    // 300 (->L2) + 500 (->L3) = 800 reaches L3; +150 into L3
    expect(resolveLevel(950)).toEqual({ level: 3, xpIntoLevel: 150, xpForNext: 700 });
  });

  it("never drops below level 1 for negative/garbage XP", () => {
    expect(resolveLevel(-100).level).toBe(1);
  });
});
