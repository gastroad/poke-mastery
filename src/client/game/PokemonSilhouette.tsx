"use client";

import Image from "next/image";
import { spritePath } from "@/shared/sprites";

/**
 * "Who's that Pokémon?" display: a black silhouette sits on a bright disc while
 * the player guesses, then fades to full-color official artwork on reveal.
 * (Black-on-dark would be invisible, hence the light spotlight behind it.)
 */
export function PokemonSilhouette({ pokemonId, revealed }: { pokemonId: number; revealed: boolean }) {
  return (
    <div className="flex h-64 w-64 items-center justify-center rounded-full bg-gradient-to-b from-slate-100 to-slate-300 shadow-inner">
      <Image
        key={pokemonId}
        src={spritePath(pokemonId, "artwork")}
        alt={revealed ? "정답 포켓몬" : "실루엣 포켓몬"}
        width={200}
        height={200}
        priority
        className={`h-48 w-48 object-contain transition-[filter,transform] duration-500 ${
          revealed ? "scale-105 brightness-100" : "brightness-0"
        }`}
      />
    </div>
  );
}
