/**
 * Sprite variants downloaded by scripts/sync-pokemon-data.ts into
 * public/sprites/{dir}/{id}.{ext}. Paths are DERIVED (never stored in data),
 * so adding a variant needs no data regeneration — just an entry here + the script.
 *
 * Only the 96px pixel family is kept. It is the one style PokéAPI has for every
 * species, so it's what lets a mode cover all nine generations; the prettier
 * variants (official artwork, HOME renders, animated GIFs, Dream World vectors)
 * existed for Gen 1 alone and cost ~57MB of committed binaries to serve a
 * silhouette that reads fine as a pixel sprite. Re-add an entry here plus its
 * picker in the sync script if a mode ever needs one.
 *
 * shared/ is a leaf layer: no imports from domain/client/server. `id` is a plain
 * number here to keep it dependency-free.
 */
export type SpriteVariant =
  | "pixel" // front sprite — every species, used by every mode
  | "pixel-back" // back sprite — only synced where a gender difference needs it
  | "pixel-female" // female front sprite — only for species that look different by gender
  | "pixel-back-female"; // female back sprite (some species differ only from behind)

export const SPRITE_META: Record<SpriteVariant, { dir: string; ext: string; size: number }> = {
  pixel: { dir: "pixel", ext: "png", size: 96 },
  "pixel-back": { dir: "pixel-back", ext: "png", size: 96 },
  "pixel-female": { dir: "pixel-female", ext: "png", size: 96 },
  "pixel-back-female": { dir: "pixel-back-female", ext: "png", size: 96 },
};

/** Local /public path for a Pokémon's sprite in the given variant. */
export function spritePath(id: number, variant: SpriteVariant): string {
  const meta = SPRITE_META[variant];
  return `/sprites/${meta.dir}/${id}.${meta.ext}`;
}
