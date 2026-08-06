import { describe, expect, it } from "vitest";
import { type ClearFacts, judgeClear, meetsGoal } from "./clear";

const facts = (over: Partial<ClearFacts> = {}): ClearFacts => ({
  planned: 10,
  attempted: 10,
  correct: 10,
  lines: 0,
  ...over,
});

describe("meetsGoal", () => {
  describe("accuracy", () => {
    it("measures against the planned count, not what was reached", () => {
      const goal = { kind: "accuracy", min: 0.7 } as const;
      expect(meetsGoal(goal, facts({ correct: 7 }))).toBe(true);
      expect(meetsGoal(goal, facts({ correct: 6 }))).toBe(false);
    });

    it("refuses to let quitting early look like a flawless run", () => {
      // One question reached, one right — 100% of what was attempted, 10% of
      // what was asked. This is THE case the planned/attempted split exists for.
      const played = facts({ planned: 10, attempted: 1, correct: 1 });
      expect(meetsGoal({ kind: "accuracy", min: 0.7 }, played)).toBe(false);
      expect(meetsGoal({ kind: "accuracy", min: 1 }, played)).toBe(false);
    });

    it("is false when nothing was planned (no dividing by zero)", () => {
      expect(meetsGoal({ kind: "accuracy", min: 0 }, facts({ planned: 0 }))).toBe(false);
    });
  });

  describe("correctCount", () => {
    it("counts heads and ignores the denominator", () => {
      const goal = { kind: "correctCount", min: 15 } as const;
      expect(meetsGoal(goal, facts({ planned: 1000, attempted: 40, correct: 15 }))).toBe(true);
      expect(meetsGoal(goal, facts({ planned: 1000, attempted: 40, correct: 14 }))).toBe(false);
    });
  });

  describe("bingoLines", () => {
    it("compares completed lines", () => {
      expect(meetsGoal({ kind: "bingoLines", min: 2 }, facts({ lines: 2 }))).toBe(true);
      expect(meetsGoal({ kind: "bingoLines", min: 2 }, facts({ lines: 1 }))).toBe(false);
    });
  });

  describe("noMistakes", () => {
    it("passes only when everything reached was right", () => {
      expect(meetsGoal({ kind: "noMistakes" }, facts({ attempted: 20, correct: 20 }))).toBe(true);
      expect(meetsGoal({ kind: "noMistakes" }, facts({ attempted: 20, correct: 19 }))).toBe(false);
    });

    it("is false for a game that never started", () => {
      expect(meetsGoal({ kind: "noMistakes" }, facts({ attempted: 0, correct: 0 }))).toBe(false);
    });
  });
});

describe("judgeClear", () => {
  const goals = {
    clear: { kind: "accuracy", min: 0.7 },
    perfect: { kind: "accuracy", min: 1 },
  } as const;

  it("reports both bars", () => {
    expect(judgeClear(goals, facts({ correct: 10 }))).toEqual({ cleared: true, perfect: true });
    expect(judgeClear(goals, facts({ correct: 7 }))).toEqual({ cleared: true, perfect: false });
    expect(judgeClear(goals, facts({ correct: 3 }))).toEqual({ cleared: false, perfect: false });
  });

  it("never awards a perfect on a challenge that wasn't cleared", () => {
    // Time-attack's shape: three answered, none wrong — flawless, but nowhere
    // near the headcount the clear bar asks for.
    const timeAttack = {
      clear: { kind: "correctCount", min: 15 },
      perfect: { kind: "noMistakes" },
    } as const;
    const played = facts({ planned: 1000, attempted: 3, correct: 3 });
    expect(meetsGoal(timeAttack.perfect, played)).toBe(true); // the goal alone passes
    expect(judgeClear(timeAttack, played)).toEqual({ cleared: false, perfect: false });
  });
});
