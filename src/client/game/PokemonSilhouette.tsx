"use client";

import Image from "next/image";
import { spritePath } from "@/shared/sprites";

/**
 * The pixel sprite on a bright disc, dimmed by a continuous `brightness`
 * (0 = pure black silhouette, 1 = full color). Quiz flips 0→1 on reveal;
 * time-attack stays 0; reveal-rush animates 0→1 over the question's time.
 *
 * Pixel rather than the official artwork: artwork gives a cleaner outline but
 * PokéAPI only has it for Gen 1, so using it capped the whole quiz at 151
 * species. The pixel sprite exists for all 1025 and reads perfectly well as a
 * silhouette once it's scaled up with `pixelated` rendering.
 */
export function PokemonSilhouette({
  pokemonId,
  brightness,
  transitionSec = 0.5,
}: {
  pokemonId: number;
  brightness: number;
  transitionSec?: number;
}) {
  return (
    <div className="flex h-44 w-44 items-center justify-center rounded-full bg-gradient-to-b from-zinc-100 to-zinc-300 shadow-inner sm:h-64 sm:w-64">
      <Image
        key={pokemonId}
        src={spritePath(pokemonId, "pixel")}
        alt={brightness >= 1 ? "정답 포켓몬" : "실루엣 포켓몬"}
        width={96}
        height={96}
        priority
        unoptimized
        className="h-40 w-40 object-contain [image-rendering:pixelated] sm:h-60 sm:w-60"
        style={{ filter: `brightness(${brightness})`, transition: `filter ${transitionSec}s linear` }}
      />
    </div>
  );
}
