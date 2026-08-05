"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AuthStatus } from "@/client/auth/AuthStatus";
import { PokeballFrame } from "@/client/ui/PokeballFrame";
import { WheelPicker, type WheelItem } from "@/client/ui/WheelPicker";
import { getPool, modesForPool, POOLS } from "@/domain/challenge/catalog";
import { isUnlocked } from "@/domain/challenge/unlock";
import { EMPTY_PROGRESS } from "@/domain/progress/applyPlayResult";

/**
 * Two-step challenge picker as a Poké Ball–framed wheel: scroll to a pool
 * (generation / type), tap to confirm, then scroll to a mode and tap to play.
 */
export function ChallengeSelect() {
  const router = useRouter();
  const [pool, setPool] = useState<{ id: string; label: string } | null>(null);

  const poolItems = useMemo<WheelItem[]>(
    () =>
      POOLS.map((p) => ({
        id: p.id,
        label: p.label,
        locked: !isUnlocked(p.unlock, EMPTY_PROGRESS),
      })),
    [],
  );

  // Which modes exist depends on the pool: the full dex offers bingo, a single
  // generation offers the silhouette formats. See `modesForPool`.
  const modeItems = useMemo<WheelItem[]>(
    () =>
      pool
        ? modesForPool(pool.id).map((m) => ({ id: m.id, label: m.label, sublabel: m.description }))
        : [],
    [pool],
  );

  return (
    <main className="page-enter relative flex min-h-[100dvh] flex-col overflow-hidden bg-zinc-950 text-zinc-100">
      <PokeballFrame />

      {/* Header and hint float over the scene rather than sitting in the column,
          so the wheel below centers on the VIEWPORT — which is where the ball's
          opening is. In flow they pushed it ~20px off the seam. */}
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 bg-gradient-to-b from-zinc-950/70 to-transparent px-6 pb-8 pt-6">
        <div className="flex items-center gap-2">
          {pool && (
            <button
              type="button"
              onClick={() => setPool(null)}
              aria-label="풀 다시 선택"
              className="-ml-1 rounded-full p-1 text-zinc-300 transition hover:text-zinc-50"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}
          <h1 className="text-lg font-black tracking-tight drop-shadow-[0_1px_8px_rgba(0,0,0,0.6)]">
            {pool ? `${pool.label} · 모드 선택` : "무엇을 플레이할까요?"}
          </h1>
        </div>
        <AuthStatus />
      </header>

      {/* The wheel takes the full height: it only LOOKS like it sits inside the
          ball's opening (its mask does that), but you can flick it anywhere on
          the screen. It used to be a fixed 320px band with dead space around it.
          `absolute inset-0` is deliberate — the scroller's spacers are sized in
          %, so they need an ancestor with a DEFINITE height. As a flex child it
          resolved to auto and the spacers collapsed to 0. */}
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <div className="h-full w-full max-w-md md:max-w-lg">
          {pool ? (
            <WheelPicker
              key="mode"
              items={modeItems}
              ariaLabel="모드 선택"
              onConfirm={(item) => router.push(`/play/${pool.id}/${item.id}`)}
            />
          ) : (
            <WheelPicker
              key="pool"
              items={poolItems}
              ariaLabel="풀 선택"
              onConfirm={(item) => {
                const p = getPool(item.id);
                if (p) setPool({ id: p.id, label: p.label });
              }}
            />
          )}
        </div>
      </div>

      {/* Sits on the white lower cap, so it needs a darker grey than the rest. */}
      <p className="pointer-events-none absolute inset-x-0 bottom-0 z-10 pb-8 text-center text-xs text-zinc-600 md:text-sm">
        스크롤해서 고르고 · 가운데를 탭하세요
      </p>
    </main>
  );
}
