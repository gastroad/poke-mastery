"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AuthStatus } from "@/client/auth/AuthStatus";
import { GENERATION_POOLS, MODES, type PoolDef, TYPE_POOLS } from "@/domain/challenge/catalog";
import { isUnlocked } from "@/domain/challenge/unlock";
import { EMPTY_PROGRESS } from "@/domain/progress/applyPlayResult";

/** Two-step picker: choose a pool (generation / type), then a mode. */
export function ChallengeSelect() {
  const [pool, setPool] = useState<PoolDef | null>(null);

  return (
    <main className="page-enter flex min-h-full flex-1 flex-col items-center bg-zinc-950 px-6 py-12 text-zinc-100">
      <div className="flex w-full max-w-lg flex-col gap-8">
        <header className="list-rise flex items-center justify-between gap-3">
          <h1 className="text-2xl font-black tracking-tight">{pool ? pool.label : "무엇을 플레이할까요?"}</h1>
          <AuthStatus />
        </header>

        {pool ? <ModeStep pool={pool} onBack={() => setPool(null)} /> : <PoolStep onPick={setPool} />}
      </div>
    </main>
  );
}

function PoolStep({ onPick }: { onPick: (pool: PoolDef) => void }) {
  return (
    <div className="flex flex-col gap-6">
      <PoolGroup title="세대" pools={GENERATION_POOLS} onPick={onPick} delay={80} />
      <PoolGroup title="타입" pools={TYPE_POOLS} onPick={onPick} delay={160} />
    </div>
  );
}

function PoolGroup({
  title,
  pools,
  onPick,
  delay,
}: {
  title: string;
  pools: PoolDef[];
  onPick: (pool: PoolDef) => void;
  delay: number;
}) {
  return (
    <section className="list-rise flex flex-col gap-2" style={{ animationDelay: `${delay}ms` }}>
      <h2 className="text-sm font-semibold text-zinc-400">{title}</h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {pools.map((pool) =>
          isUnlocked(pool.unlock, EMPTY_PROGRESS) ? (
            <button
              key={pool.id}
              type="button"
              onClick={() => onPick(pool)}
              className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-sm font-medium transition hover:border-poke-500 hover:bg-zinc-800"
            >
              {pool.label}
            </button>
          ) : (
            <div
              key={pool.id}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-3 text-sm text-zinc-600"
            >
              <Lock className="h-3.5 w-3.5" />
              {pool.label}
            </div>
          ),
        )}
      </div>
    </section>
  );
}

function ModeStep({ pool, onBack }: { pool: PoolDef; onBack: () => void }) {
  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={onBack}
        className="list-rise self-start text-sm text-zinc-400 transition hover:text-zinc-200"
      >
        ← 다른 풀 선택
      </button>
      {MODES.map((mode, i) => (
        <Link
          key={mode.id}
          href={`/play/${pool.id}/${mode.id}`}
          style={{ animationDelay: `${80 + i * 80}ms` }}
          className="list-rise flex items-center justify-between rounded-2xl border border-zinc-700 bg-zinc-900 px-5 py-4 transition hover:border-poke-500 hover:bg-zinc-800"
        >
          <div className="flex min-w-0 flex-col">
            <span className="text-lg font-semibold">{mode.label}</span>
            <span className="truncate text-sm text-zinc-400">{mode.description}</span>
          </div>
          <span className="shrink-0 pl-3 text-sm font-medium text-poke-400">플레이 →</span>
        </Link>
      ))}
    </div>
  );
}
