import { describe, expect, it } from "vitest";
import { judgeAnswer } from "./judgeAnswer";

// Pre-normalized accepted answers, as the data pipeline produces them.
const pikachu = ["피카츄"];
const nidoran = ["니드런", "니드런암", "니드런수", "니드런♀", "니드런♂"];

describe("judgeAnswer", () => {
  it("accepts the exact name", () => {
    expect(judgeAnswer("피카츄", pikachu)).toBe(true);
  });

  it("accepts surrounding/inner whitespace (normalized away)", () => {
    expect(judgeAnswer("  피카츄 ", pikachu)).toBe(true);
    expect(judgeAnswer("피 카 츄", pikachu)).toBe(true);
  });

  it("rejects a wrong name", () => {
    expect(judgeAnswer("라이츄", pikachu)).toBe(false);
  });

  it("rejects empty / whitespace-only input", () => {
    expect(judgeAnswer("", pikachu)).toBe(false);
    expect(judgeAnswer("   ", pikachu)).toBe(false);
  });

  it("accepts every Nidoran gender spelling", () => {
    for (const answer of ["니드런", "니드런암", "니드런수", "니드런♀", "니드런♂"]) {
      expect(judgeAnswer(answer, nidoran)).toBe(true);
    }
  });
});
