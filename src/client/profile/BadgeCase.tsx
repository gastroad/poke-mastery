"use client";

import { Lock } from "lucide-react";
import { modeBall } from "@/client/game/modeBall";
import { Pokeball } from "@/client/ui/Pokeball";
import { BADGES } from "@/domain/badge/catalog";

/**
 * The badge case — every badge in the catalog, held ones lit and the rest
 * greyed out with what they ask for. Showing the locked ones is the point: a
 * badge nobody can see isn't a goal, it's a surprise.
 *
 * A gym badge borrows its game's ball colour, so the case reads as a row of the
 * games it came from (see `client/game/modeBall`).
 */
export function BadgeCase({ earned }: { earned: readonly string[] }) {
  const held = new Set(earned);

  return (
    <section className="flex flex-col gap-3">
      <header className="flex items-baseline justify-between">
        <h2 className="text-lg font-bold">배지</h2>
        <span className="font-mono text-sm tabular-nums text-zinc-500">
          {held.size} / {BADGES.length}
        </span>
      </header>

      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {BADGES.map((badge) => {
          const has = held.has(badge.id);
          // Gym/mastery badges are `gym-<modeId>` / `master-<modeId>`.
          const modeId = badge.id.replace(/^(gym|master)-/, "");
          const ball = modeBall(modeId);

          return (
            <li
              key={badge.id}
              className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-4 text-center ${
                has ? "border-zinc-700 bg-zinc-900" : "border-zinc-800/60 bg-zinc-950"
              }`}
            >
              {has ? (
                <Pokeball decorative className="h-9 w-9" topColor={ball.color} />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900">
                  <Lock className="h-4 w-4 text-zinc-700" />
                </span>
              )}
              <span
                className={`text-xs font-bold ${has ? "text-zinc-100" : "text-zinc-600"}`}
              >
                {badge.name}
              </span>
              <span className="text-[10px] leading-snug text-zinc-600">{badge.description}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
