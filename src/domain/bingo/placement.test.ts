import { describe, expect, it } from "vitest";
import type { Pokemon } from "../pokemon/types";
import { findByAnswer, judgePlacement } from "./placement";
import type { BingoCell } from "./types";

const dex: Pokemon[] = [
  { id: 6, nameKo: "리자몽", nameEn: "charizard", generation: 1, types: ["fire", "flying"], heightDm: 10, weightHg: 100, acceptedAnswers: ["리자몽"] },
  { id: 9, nameKo: "거북왕", nameEn: "blastoise", generation: 1, types: ["water"], heightDm: 10, weightHg: 100, acceptedAnswers: ["거북왕"] },
  { id: 257, nameKo: "번치코", nameEn: "blaziken", generation: 3, types: ["fire", "fighting"], heightDm: 10, weightHg: 100, acceptedAnswers: ["번치코"] },
];

const fireGen1: BingoCell = { index: 0, generation: 1, type: "fire" };
const flyingGen1: BingoCell = { index: 1, generation: 1, type: "flying" };
const waterGen3: BingoCell = { index: 4, generation: 3, type: "water" };
const empty = [null, null, null, null, null, null, null, null, null];

describe("findByAnswer", () => {
  it("resolves a name", () => {
    expect(findByAnswer(dex, "리자몽")?.id).toBe(6);
  });

  it("normalizes like the rest of the game (spaces are ignored)", () => {
    expect(findByAnswer(dex, "  리자몽 ")?.id).toBe(6);
  });

  it("returns null for a name nothing answers to", () => {
    expect(findByAnswer(dex, "없는포켓몬")).toBeNull();
  });
});

describe("judgePlacement", () => {
  it("accepts a Pokémon that satisfies the cell", () => {
    expect(judgePlacement(fireGen1, "리자몽", dex, empty)).toEqual({
      kind: "placed",
      pokemonId: 6,
      generation: 1,
      types: ["fire", "flying"],
    });
  });

  it("accepts the same Pokémon in either cell it qualifies for — the player picks", () => {
    expect(judgePlacement(fireGen1, "리자몽", dex, empty).kind).toBe("placed");
    expect(judgePlacement(flyingGen1, "리자몽", dex, empty).kind).toBe("placed");
  });

  it("rejects an unknown name", () => {
    expect(judgePlacement(fireGen1, "없는포켓몬", dex, empty)).toEqual({ kind: "unknown" });
  });

  it("rejects a real Pokémon aimed at the wrong cell, and says what it actually is", () => {
    // 번치코 is fire, but gen 3 — and this cell wants gen 1.
    expect(judgePlacement(fireGen1, "번치코", dex, empty)).toEqual({
      kind: "mismatch",
      pokemonId: 257,
      generation: 3,
      types: ["fire", "fighting"],
    });
  });

  it("rejects the right generation with the wrong type", () => {
    const result = judgePlacement(waterGen3, "거북왕", dex, empty);
    expect(result.kind).toBe("mismatch");
  });

  it("rejects a Pokémon already used on the board, and points at where", () => {
    const placed = [null, null, null, 6, null, null, null, null, null];
    expect(judgePlacement(fireGen1, "리자몽", dex, placed)).toEqual({
      kind: "duplicate",
      pokemonId: 6,
      usedAtCell: 3,
    });
  });

  it("does not call a cell a duplicate of itself (re-answering one cell is fine)", () => {
    const placed = [6, null, null, null, null, null, null, null, null];
    expect(judgePlacement(fireGen1, "리자몽", dex, placed).kind).toBe("placed");
  });

  it("treats blank input as unknown", () => {
    expect(judgePlacement(fireGen1, "   ", dex, empty)).toEqual({ kind: "unknown" });
  });
});
