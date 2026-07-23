"use client";

import Image from "next/image";
import { spritePath } from "@/shared/sprites";

/**
 * Official artwork on a bright disc, dimmed by a continuous `brightness`
 * (0 = pure black silhouette, 1 = full color). Quiz flips 0→1 on reveal;
 * time-attack stays 0; reveal-rush animates 0→1 over the question's time.
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
        src={spritePath(pokemonId, "artwork")}
        alt={brightness >= 1 ? "정답 포켓몬" : "실루엣 포켓몬"}
        width={200}
        height={200}
        priority
        className="h-32 w-32 object-contain sm:h-48 sm:w-48"
        style={{ filter: `brightness(${brightness})`, transition: `filter ${transitionSec}s linear` }}
      />
    </div>
  );
}
