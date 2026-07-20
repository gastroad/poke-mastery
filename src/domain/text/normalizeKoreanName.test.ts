import { describe, it, expect } from "vitest";
import { normalizeKoreanName } from "./normalizeKoreanName";

describe("normalizeKoreanName", () => {
  it("removes surrounding and internal whitespace", () => {
    expect(normalizeKoreanName("  피카츄  ")).toBe("피카츄");
    expect(normalizeKoreanName("파이 리")).toBe("파이리");
  });

  it("is idempotent (normalizing twice equals normalizing once)", () => {
    const once = normalizeKoreanName(" 이상해씨 ");
    expect(normalizeKoreanName(once)).toBe(once);
  });

  it("NFC-normalizes: decomposed Hangul equals composed", () => {
    const composed = "가"; // U+AC00
    const decomposed = "가"; // ㄱ + ㅏ
    expect(normalizeKoreanName(decomposed)).toBe(normalizeKoreanName(composed));
  });
});
