import { describe, expect, it } from "vitest";
import { applyPlayToRecord, type ChallengeRecord, EMPTY_RECORD } from "./challengeRecord";

const play = (score: number, cleared = false, perfect = false) => ({
  score,
  status: { cleared, perfect },
});

describe("applyPlayToRecord", () => {
  it("records the first play", () => {
    const { record, delta } = applyPlayToRecord(EMPTY_RECORD, play(820, true));
    expect(record).toEqual<ChallengeRecord>({
      bestScore: 820,
      cleared: true,
      perfect: false,
      playCount: 1,
    });
    expect(delta).toEqual({ newBest: true, firstClear: true, firstPerfect: false });
  });

  it("keeps the better score and says so", () => {
    const first = applyPlayToRecord(EMPTY_RECORD, play(500)).record;
    const better = applyPlayToRecord(first, play(900));
    expect(better.record.bestScore).toBe(900);
    expect(better.delta.newBest).toBe(true);

    const worse = applyPlayToRecord(better.record, play(100));
    expect(worse.record.bestScore).toBe(900);
    expect(worse.delta.newBest).toBe(false);
  });

  it("does not call a tie a new best", () => {
    const first = applyPlayToRecord(EMPTY_RECORD, play(400)).record;
    expect(applyPlayToRecord(first, play(400)).delta.newBest).toBe(false);
  });

  it("does not celebrate a scoreless first play", () => {
    expect(applyPlayToRecord(EMPTY_RECORD, play(0)).delta.newBest).toBe(false);
  });

  it("never un-clears a challenge once cleared", () => {
    const cleared = applyPlayToRecord(EMPTY_RECORD, play(800, true, true)).record;
    const bad = applyPlayToRecord(cleared, play(10, false, false));
    expect(bad.record.cleared).toBe(true);
    expect(bad.record.perfect).toBe(true);
  });

  it("marks first clear and first perfect only once", () => {
    const a = applyPlayToRecord(EMPTY_RECORD, play(700, true, false));
    expect(a.delta).toMatchObject({ firstClear: true, firstPerfect: false });

    const b = applyPlayToRecord(a.record, play(1000, true, true));
    expect(b.delta).toMatchObject({ firstClear: false, firstPerfect: true });

    const c = applyPlayToRecord(b.record, play(1100, true, true));
    expect(c.delta).toMatchObject({ firstClear: false, firstPerfect: false });
  });

  it("counts every play, cleared or not", () => {
    let record = EMPTY_RECORD;
    for (let i = 0; i < 4; i++) record = applyPlayToRecord(record, play(100)).record;
    expect(record.playCount).toBe(4);
  });
});
