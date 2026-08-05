import type { Pokemon, PokemonType } from "../pokemon/types";

/**
 * Builds a fake dataset with an exact number of Pokémon per (generation, type),
 * for tests only — it is what lets a test say "this cell has 2 answers" and then
 * assert the generator refuses it.
 *
 * Every mon is single-typed, so the counts in the spec ARE the cell counts.
 */
export function buildDataset(spec: Record<number, Partial<Record<PokemonType, number>>>): Pokemon[] {
  const out: Pokemon[] = [];
  let id = 1;
  for (const [gen, row] of Object.entries(spec)) {
    for (const [type, count] of Object.entries(row)) {
      for (let i = 0; i < (count ?? 0); i++) {
        const nameKo = `몬${id}`;
        out.push({
          id,
          nameKo,
          nameEn: `mon${id}`,
          generation: Number(gen),
          types: [type as PokemonType],
          acceptedAnswers: [nameKo],
        });
        id++;
      }
    }
  }
  return out;
}

/**
 * A miniature stand-in for the real dex, shaped like the real one where it
 * matters: gen 1 has NO dark type (Dark only arrived in Gen 2), and a few cells
 * are deliberately too thin to be playable.
 */
export const MOCK_DEX = buildDataset({
  1: { normal: 6, fire: 6, water: 8, grass: 6, electric: 5, ice: 2, dark: 0 },
  2: { normal: 6, fire: 5, water: 6, grass: 5, electric: 4, ice: 4, dark: 5 },
  3: { normal: 7, fire: 5, water: 9, grass: 6, electric: 4, ice: 4, dark: 5 },
  4: { normal: 6, fire: 4, water: 6, grass: 5, electric: 4, ice: 1, dark: 4 },
  5: { normal: 8, fire: 6, water: 6, grass: 7, electric: 5, ice: 4, dark: 6 },
});
