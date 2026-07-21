import { describe, expect, it } from "vitest";
import { BEGINNER_CHALLENGE, CHALLENGES, getChallenge, unlockedChallenges } from "./catalog";
import { EMPTY_PROGRESS } from "../progress/applyPlayResult";

describe("challenge catalog", () => {
  it("has unique ids", () => {
    const ids = CHALLENGES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every challenge asks at least one question", () => {
    for (const c of CHALLENGES) expect(c.rule.questionCount).toBeGreaterThan(0);
  });

  it("the beginner challenge is always unlocked", () => {
    expect(BEGINNER_CHALLENGE.unlock).toEqual({ kind: "always" });
    expect(unlockedChallenges(EMPTY_PROGRESS)).toContainEqual(BEGINNER_CHALLENGE);
  });

  it("a fresh player only sees the always-open challenges", () => {
    const open = unlockedChallenges(EMPTY_PROGRESS);
    expect(open.every((c) => c.unlock.kind === "always")).toBe(true);
  });

  it("higher level and mastery open more challenges", () => {
    const strong = { totalXp: 2400, typeStats: { fire: { seen: 12, correct: 11 } } };
    const openIds = unlockedChallenges(strong).map((c) => c.id);
    expect(openIds).toContain("kanto-marathon"); // level gate
    expect(openIds).toContain("fire-trial"); // mastery gate
  });

  it("getChallenge finds by id and returns undefined otherwise", () => {
    expect(getChallenge("kanto-beginner")).toBe(BEGINNER_CHALLENGE);
    expect(getChallenge("nope")).toBeUndefined();
  });
});
