/**
 * Sprite variants downloaded by scripts/sync-pokemon-data.ts into
 * public/sprites/{dir}/{id}.{ext}. Paths are DERIVED (never stored in data),
 * so adding a variant needs no data regeneration — just an entry here + the script.
 *
 * shared/ is a leaf layer: no imports from domain/client/server. `id` is a plain
 * number here to keep it dependency-free.
 */
export type SpriteVariant =
  | "artwork" // official artwork, high-res — question display, silhouette (via CSS filter)
  | "pixel" // classic front pixel sprite — small UI, grids, combos
  | "pixel-back" // classic back pixel sprite
  | "animated" // animated GIF (Gen 5 style) front — reveal/celebration juice
  | "animated-back" // animated GIF back
  | "retro" // original RBY front sprite — retro flair
  | "retro-back" // original RBY back sprite
  | "home" // HOME 3D-render style (static PNG, no 3D engine needed)
  | "dreamworld"; // Dream World SVG vector art (scalable)

export const SPRITE_META: Record<SpriteVariant, { dir: string; ext: string; size: number }> = {
  artwork: { dir: "artwork", ext: "png", size: 475 },
  pixel: { dir: "pixel", ext: "png", size: 96 },
  "pixel-back": { dir: "pixel-back", ext: "png", size: 96 },
  animated: { dir: "animated", ext: "gif", size: 96 },
  "animated-back": { dir: "animated-back", ext: "gif", size: 96 },
  retro: { dir: "retro", ext: "png", size: 96 },
  "retro-back": { dir: "retro-back", ext: "png", size: 96 },
  home: { dir: "home", ext: "png", size: 512 },
  dreamworld: { dir: "dreamworld", ext: "svg", size: 400 },
};

/** Local /public path for a Pokémon's sprite in the given variant. */
export function spritePath(id: number, variant: SpriteVariant): string {
  const meta = SPRITE_META[variant];
  return `/sprites/${meta.dir}/${id}.${meta.ext}`;
}
