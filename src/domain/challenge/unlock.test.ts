import { describe, expect, it } from "vitest";
import { describeUnlock, isUnlocked } from "./unlock";
import { EMPTY_PROGRESS } from "../progress/applyPlayResult";
import type { Progress } from "../progress/types";

describe("isUnlocked", () => {
  it("always opens for the 'always' gate", () => {
    expect(isUnlocked({ kind: "always" }, EMPTY_PROGRESS)).toBe(true);
  });

  it("never opens a 'comingSoon' gate", () => {
    expect(isUnlocked({ kind: "comingSoon" }, EMPTY_PROGRESS)).toBe(false);
    expect(describeUnlock({ kind: "comingSoon" })).toBe("준비 중");
  });

  it("level gate compares against the resolved level", () => {
    expect(isUnlocked({ kind: "level", min: 5 }, { totalXp: 250, typeStats: {} })).toBe(false);
    // 300+500+700+900 = 2400 XP reaches level 5
    expect(isUnlocked({ kind: "level", min: 5 }, { totalXp: 2400, typeStats: {} })).toBe(true);
  });

  it("typeMastery gate needs both exposure and accuracy", () => {
    const lowExposure: Progress = { totalXp: 0, typeStats: { fire: { seen: 5, correct: 5 } } };
    const mastered: Progress = { totalXp: 0, typeStats: { fire: { seen: 12, correct: 10 } } };
    expect(isUnlocked({ kind: "typeMastery", type: "fire", minPct: 70 }, lowExposure)).toBe(false);
    expect(isUnlocked({ kind: "typeMastery", type: "fire", minPct: 70 }, mastered)).toBe(true);
  });
});

describe("describeUnlock", () => {
  it("localizes conditions to Korean", () => {
    expect(describeUnlock({ kind: "always" })).toBe("항상 열림");
    expect(describeUnlock({ kind: "level", min: 5 })).toBe("레벨 5 필요");
    expect(describeUnlock({ kind: "typeMastery", type: "fire", minPct: 70 })).toBe(
      "불꽃 타입 마스터리 70% 필요",
    );
  });
});
