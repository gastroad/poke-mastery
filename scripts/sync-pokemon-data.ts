/**
 * Dev-time sync script (NOT run during play).
 *
 * Fetches Gen 1 (151) from PokéAPI and produces:
 *   - src/data/pokemon.json          normalized Pokemon[] (Korean names, types, acceptedAnswers)
 *   - public/sprites/{variant}/{id}.{ext}   every sprite variant in SPRITE_META
 *
 * Sprite paths are derived from id (see shared/sprites.ts), so they are NOT stored in the JSON.
 *
 * Run with: npm run sync-data
 */
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { normalizeKoreanName } from "../src/domain/text/normalizeKoreanName";
import type { Pokemon, PokemonType } from "../src/domain/pokemon/types";
import { SPRITE_META, type SpriteVariant } from "../src/shared/sprites";

const GEN1_COUNT = 151;
const API = "https://pokeapi.co/api/v2";
const CONCURRENCY = 8;

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "src", "data");
const SPRITE_ROOT = path.join(ROOT, "public", "sprites");

// ── PokéAPI response shapes (only the fields we use) ──
interface Sprites {
  front_default: string | null;
  back_default: string | null;
  other?: {
    dream_world?: { front_default: string | null };
    home?: { front_default: string | null };
    "official-artwork"?: { front_default: string | null };
  };
  versions?: {
    "generation-i"?: { "red-blue"?: { front_default: string | null; back_default: string | null } };
    "generation-v"?: {
      "black-white"?: { animated?: { front_default: string | null; back_default: string | null } };
    };
  };
}
interface PokemonResponse {
  name: string;
  types: { slot: number; type: { name: string } }[];
  sprites: Sprites;
}
interface SpeciesResponse {
  names: { language: { name: string }; name: string }[];
}

/** Where each sprite variant lives inside PokéAPI's `sprites` object. */
const PICKERS: Record<SpriteVariant, (s: Sprites) => string | null | undefined> = {
  artwork: (s) => s.other?.["official-artwork"]?.front_default,
  pixel: (s) => s.front_default,
  "pixel-back": (s) => s.back_default,
  animated: (s) => s.versions?.["generation-v"]?.["black-white"]?.animated?.front_default,
  "animated-back": (s) => s.versions?.["generation-v"]?.["black-white"]?.animated?.back_default,
  retro: (s) => s.versions?.["generation-i"]?.["red-blue"]?.front_default,
  "retro-back": (s) => s.versions?.["generation-i"]?.["red-blue"]?.back_default,
  home: (s) => s.other?.home?.front_default,
  dreamworld: (s) => s.other?.dream_world?.front_default,
};

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
  return res.json() as Promise<T>;
}

/** Small concurrency-limited map that preserves input order. */
async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const idx = cursor++;
      results[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

/**
 * Korean names never contain ♀/♂ that a player can type, and gender is not tested,
 * so any gender-symbol Pokémon (Nidoran) accepts base + both gender spellings + both symbols.
 */
function acceptedAnswersFor(nameKo: string): string[] {
  const n = normalizeKoreanName(nameKo);
  if (n.includes("♀") || n.includes("♂")) {
    const base = n.replace(/[♀♂]/g, "");
    const variants = [base, `${base}암`, `${base}수`, `${base}♀`, `${base}♂`];
    return [...new Set(variants.map(normalizeKoreanName))];
  }
  return [n];
}

async function downloadSprite(url: string, variant: SpriteVariant, id: number): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${variant} sprite #${id} → ${res.status}`);
  const meta = SPRITE_META[variant];
  const dest = path.join(SPRITE_ROOT, meta.dir, `${id}.${meta.ext}`);
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
}

async function buildPokemon(id: number): Promise<Pokemon> {
  const [p, s] = await Promise.all([
    fetchJson<PokemonResponse>(`${API}/pokemon/${id}`),
    fetchJson<SpeciesResponse>(`${API}/pokemon-species/${id}`),
  ]);

  const nameKo = s.names.find((nm) => nm.language.name === "ko")?.name ?? p.name;
  const types = [...p.types].sort((a, b) => a.slot - b.slot).map((t) => t.type.name as PokemonType);

  const variants = Object.keys(SPRITE_META) as SpriteVariant[];
  const missing = (
    await Promise.all(
      variants.map(async (variant) => {
        const url = PICKERS[variant](p.sprites);
        if (!url) return variant;
        await downloadSprite(url, variant, id);
        return null;
      }),
    )
  ).filter((v): v is SpriteVariant => v !== null);
  if (missing.length) console.warn(`  ⚠︎ #${id} ${nameKo}: missing ${missing.join(", ")}`);

  return {
    id,
    nameKo,
    nameEn: p.name,
    generation: 1,
    types,
    acceptedAnswers: acceptedAnswersFor(nameKo),
  };
}

async function main(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  for (const meta of Object.values(SPRITE_META)) {
    await mkdir(path.join(SPRITE_ROOT, meta.dir), { recursive: true });
  }

  const ids = Array.from({ length: GEN1_COUNT }, (_, i) => i + 1);
  console.log(`Fetching ${ids.length} Gen 1 Pokémon + ${Object.keys(SPRITE_META).length} sprite variants each…`);

  const pokemon = (await mapPool(ids, CONCURRENCY, buildPokemon)).sort((a, b) => a.id - b.id);
  await writeFile(path.join(DATA_DIR, "pokemon.json"), `${JSON.stringify(pokemon, null, 2)}\n`, "utf8");

  console.log(`✓ src/data/pokemon.json (${pokemon.length} entries)`);
  console.log(`✓ public/sprites/{${Object.values(SPRITE_META).map((m) => m.dir).join(",")}}/`);

  const noKorean = pokemon.filter((p) => p.nameKo === p.nameEn);
  if (noKorean.length) console.warn(`⚠︎ ${noKorean.length} fell back to English name:`, noKorean.map((p) => p.id));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
