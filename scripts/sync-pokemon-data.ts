/**
 * Dev-time sync script (NOT run during play).
 *
 * Fetches the whole national dex from PokéAPI and produces:
 *   - src/data/pokemon.json          normalized Pokemon[] (Korean names, types, acceptedAnswers)
 *   - public/sprites/{variant}/{id}.{ext}   sprite variants per SPRITE_META
 *
 * Sprite budget: the 96px pixel sprite for everyone, plus a back and female pair
 * for the ~100 species the gender quiz uses. PokéAPI's prettier styles only
 * cover Gen 1 and cost ~57MB committed, which bought nothing once the silhouette
 * quiz moved to pixel sprites and gained all nine generations in exchange.
 *
 * Sprite paths are derived from id (see shared/sprites.ts), so they are NOT stored in the JSON.
 * Re-runs are cheap: an existing sprite file is left alone.
 *
 * Run with: npm run sync-data
 */
import { writeFile, mkdir, access, readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { normalizeKoreanName } from "../src/domain/text/normalizeKoreanName";
import type { GenderDiffView, Pokemon, PokemonType } from "../src/domain/pokemon/types";
import { SPRITE_META, type SpriteVariant } from "../src/shared/sprites";

/** Highest national dex number to sync (gen 9, including DLC). */
const MAX_DEX_ID = 1025;
const API = "https://pokeapi.co/api/v2";
const CONCURRENCY = 8;

const GENERATION_BY_SLUG: Record<string, number> = {
  "generation-i": 1,
  "generation-ii": 2,
  "generation-iii": 3,
  "generation-iv": 4,
  "generation-v": 5,
  "generation-vi": 6,
  "generation-vii": 7,
  "generation-viii": 8,
  "generation-ix": 9,
};

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "src", "data");
const SPRITE_ROOT = path.join(ROOT, "public", "sprites");

// ── PokéAPI response shapes (only the fields we use) ──
interface Sprites {
  front_default: string | null;
  back_default: string | null;
  front_female: string | null;
  back_female: string | null;
}
interface PokemonResponse {
  name: string;
  height: number;
  weight: number;
  types: { slot: number; type: { name: string } }[];
  sprites: Sprites;
}
interface SpeciesResponse {
  names: { language: { name: string }; name: string }[];
  generation: { name: string };
  has_gender_differences: boolean;
}

/** Where each sprite variant lives inside PokéAPI's `sprites` object. */
const PICKERS: Record<SpriteVariant, (s: Sprites) => string | null | undefined> = {
  pixel: (s) => s.front_default,
  "pixel-back": (s) => s.back_default,
  "pixel-female": (s) => s.front_female,
  "pixel-back-female": (s) => s.back_female,
};

/** The four sprites the gender quiz compares. */
const GENDER_VARIANTS: SpriteVariant[] = ["pixel", "pixel-back", "pixel-female", "pixel-back-female"];

/**
 * Retries, because a single dropped request silently costs the dex a species —
 * one flaky call used to leave a hole in pokemon.json that nothing complained
 * about.
 */
async function fetchJson<T>(url: string, attempts = 3): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
      return (await res.json()) as T;
    } catch (err) {
      if (attempt >= attempts) throw err;
      await new Promise((r) => setTimeout(r, 400 * attempt));
    }
  }
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

async function exists(file: string): Promise<boolean> {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function downloadSprite(url: string, variant: SpriteVariant, id: number): Promise<void> {
  const meta = SPRITE_META[variant];
  const dest = path.join(SPRITE_ROOT, meta.dir, `${id}.${meta.ext}`);
  if (await exists(dest)) return; // already synced — re-runs stay cheap
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${variant} sprite #${id} → ${res.status}`);
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
}

/**
 * Every species needs its front sprite; only the ones the gender quiz can use
 * also need a back and the female pair.
 */
function variantsFor(hasGenderDifferences: boolean): SpriteVariant[] {
  return hasGenderDifferences ? GENDER_VARIANTS : ["pixel"];
}

/** Sprite file on disk, or null when that variant was never downloaded. */
async function spriteBuffer(variant: SpriteVariant, id: number): Promise<Buffer | null> {
  const meta = SPRITE_META[variant];
  const file = path.join(SPRITE_ROOT, meta.dir, `${id}.${meta.ext}`);
  try {
    return await readFile(file);
  } catch {
    return null;
  }
}

/** Smallest square crop the reveal screen will zoom to, in sprite pixels. */
const MIN_DIFF_BOX = 26;
/** Breathing room around the differing pixels so the crop keeps some context. */
const DIFF_BOX_PADDING = 6;



/**
 * Compare two sprites of the same size: how many pixels differ, and the square
 * region that contains them. The reveal screen uses the region twice — to light
 * that part of the full-size sprite, and to zoom into it.
 */
async function compareSprites(a: Buffer | null, b: Buffer | null): Promise<GenderDiffView | null> {
  if (!a || !b) return null;
  const [x, y] = await Promise.all([
    sharp(a).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
    sharp(b).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
  ]);
  if (x.data.length !== y.data.length) return null;

  const width = x.info.width;
  const height = x.info.height;
  let pixels = 0;
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let i = 0; i < x.data.length; i += 4) {
    const colour =
      Math.abs(x.data[i] - y.data[i]) +
      Math.abs(x.data[i + 1] - y.data[i + 1]) +
      Math.abs(x.data[i + 2] - y.data[i + 2]);
    if (colour <= 25 && Math.abs(x.data[i + 3] - y.data[i + 3]) <= 40) continue;
    pixels++;
    const p = i / 4;
    const px = p % width;
    const py = (p - px) / width;
    if (px < minX) minX = px;
    if (px > maxX) maxX = px;
    if (py < minY) minY = py;
    if (py > maxY) maxY = py;
  }
  if (pixels === 0) return { pixels: 0, box: { x: 0, y: 0, size: width } };

  // Square, padded, and clamped inside the sprite so the crop is always valid.
  const limit = Math.min(width, height);
  const size = Math.min(
    limit,
    Math.max(MIN_DIFF_BOX, Math.max(maxX - minX, maxY - minY) + 1 + DIFF_BOX_PADDING * 2),
  );
  const centre = (lo: number, hi: number, max: number) =>
    Math.max(0, Math.min(max - size, Math.round((lo + hi) / 2 - size / 2)));
  return { pixels, box: { x: centre(minX, maxX, width), y: centre(minY, maxY, height), size } };
}

/**
 * Measure the male/female difference from the sprites we just downloaded, so the
 * game can drop species whose "difference" is a pixel or two (see Pokemon.genderDiff).
 */
async function measureGenderDiff(id: number): Promise<Pokemon["genderDiff"]> {
  const [maleFront, femaleFront, maleBack, femaleBack] = await Promise.all([
    spriteBuffer("pixel", id),
    spriteBuffer("pixel-female", id),
    spriteBuffer("pixel-back", id),
    spriteBuffer("pixel-back-female", id),
  ]);
  const front = await compareSprites(maleFront, femaleFront);
  if (front === null) return undefined;
  return { front, back: await compareSprites(maleBack, femaleBack) };
}

async function buildPokemon(id: number): Promise<Pokemon | null> {
  let p: PokemonResponse;
  let s: SpeciesResponse;
  try {
    [p, s] = await Promise.all([
      fetchJson<PokemonResponse>(`${API}/pokemon/${id}`),
      fetchJson<SpeciesResponse>(`${API}/pokemon-species/${id}`),
    ]);
  } catch {
    return null; // gaps in the dex range are simply skipped
  }

  const nameKo = s.names.find((nm) => nm.language.name === "ko")?.name ?? p.name;
  const generation = GENERATION_BY_SLUG[s.generation.name];
  if (!generation) {
    console.warn(`  ⚠︎ #${id} ${nameKo}: unknown generation "${s.generation.name}", skipped`);
    return null;
  }
  const types = [...p.types].sort((a, b) => a.slot - b.slot).map((t) => t.type.name as PokemonType);

  const missing = (
    await Promise.all(
      variantsFor(s.has_gender_differences).map(async (variant) => {
        const url = PICKERS[variant](p.sprites);
        if (!url) return variant;
        await downloadSprite(url, variant, id);
        return null;
      }),
    )
  ).filter((v): v is SpriteVariant => v !== null);
  // A missing female sprite is expected (only ~100 species have one); warn about
  // the rest, which would mean a real gap.
  const unexpected = missing.filter((v) => !v.includes("female"));
  if (unexpected.length) console.warn(`  ⚠︎ #${id} ${nameKo}: missing ${unexpected.join(", ")}`);

  return {
    id,
    nameKo,
    nameEn: p.name,
    generation,
    types,
    heightDm: p.height,
    weightHg: p.weight,
    acceptedAnswers: acceptedAnswersFor(nameKo),
    ...(s.has_gender_differences ? { genderDiff: await measureGenderDiff(id) } : {}),
  };
}

async function main(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  for (const meta of Object.values(SPRITE_META)) {
    await mkdir(path.join(SPRITE_ROOT, meta.dir), { recursive: true });
  }

  const ids = Array.from({ length: MAX_DEX_ID }, (_, i) => i + 1);
  console.log(`Fetching ${ids.length} Pokémon — pixel sprites, plus the female pair where it exists…`);

  let done = 0;
  const fetched = await mapPool(ids, CONCURRENCY, async (id) => {
    const result = await buildPokemon(id);
    if (++done % 100 === 0) console.log(`  … ${done}/${ids.length}`);
    return result;
  });
  const pokemon = fetched.filter((p): p is Pokemon => p !== null).sort((a, b) => a.id - b.id);
  await writeFile(path.join(DATA_DIR, "pokemon.json"), `${JSON.stringify(pokemon, null, 2)}\n`, "utf8");

  const byGen = pokemon.reduce<Record<number, number>>((acc, p) => {
    acc[p.generation] = (acc[p.generation] ?? 0) + 1;
    return acc;
  }, {});
  console.log(`✓ src/data/pokemon.json (${pokemon.length} entries)`);
  console.log(`  per generation: ${Object.entries(byGen).map(([g, n]) => `${g}세대 ${n}`).join(", ")}`);
  console.log(`✓ public/sprites/{${Object.values(SPRITE_META).map((m) => m.dir).join(",")}}/`);

  const gendered = pokemon.filter((p) => p.genderDiff);
  const visible = gendered.filter((p) => Math.max(p.genderDiff!.front.pixels, p.genderDiff!.back?.pixels ?? 0) >= 5);
  console.log(`✓ gender differences measured on ${gendered.length} species (${visible.length} differ by 5+ px)`);

  const noKorean = pokemon.filter((p) => p.nameKo === p.nameEn);
  if (noKorean.length) console.warn(`⚠︎ ${noKorean.length} fell back to English name:`, noKorean.map((p) => p.id));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
