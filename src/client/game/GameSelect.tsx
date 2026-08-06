"use client";

import { ChevronDown, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthStatus } from "@/client/auth/AuthStatus";
import { Pokeball } from "@/client/ui/Pokeball";
import {
  DEFAULT_POOL_ID,
  getMode,
  MODES,
  type ModeDef,
  type PoolDef,
  poolsForMode,
} from "@/domain/challenge/catalog";
import { modeBall } from "./modeBall";

/** Pools shown before the player asks for the whole list. */
const POOL_PREVIEW_COUNT = 5;

/**
 * The game picker, as master–detail.
 *
 * Desktop puts every game in a rail on the left and the chosen one's settings on
 * the right, so all six are legible at once and you can browse them without
 * committing. Mobile shows the same six as a card grid and slides the settings
 * up as a sheet. Both halves read the same state, so there is one selection, one
 * set of chips, and one start link.
 *
 * The order matters: game → range → difficulty. Picking the game first is what
 * keeps the full-dex-only modes (bingo, the gender quiz) visible — under the old
 * range-first wheel they silently vanished the moment you chose one generation.
 */
export function GameSelect() {
  // null means "the player hasn't tapped anything yet", which only the mobile
  // layout can distinguish — desktop always shows a game, defaulting to the first.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [poolId, setPoolId] = useState(DEFAULT_POOL_ID);
  const [difficultyId, setDifficultyId] = useState(MODES[0].defaultDifficultyId);
  const [poolsOpen, setPoolsOpen] = useState(false);

  const mode = getMode(selectedId ?? MODES[0].id) ?? MODES[0];

  const selectMode = useCallback((next: ModeDef) => {
    setSelectedId(next.id);
    // Settings belong to the game, so they reset with it rather than carrying a
    // stale "30초" onto a mode measured in questions.
    setPoolId(DEFAULT_POOL_ID);
    setDifficultyId(next.defaultDifficultyId);
    setPoolsOpen(false);
  }, []);

  const closeSheet = useCallback(() => setSelectedId(null), []);

  useEffect(() => {
    if (!selectedId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSheet();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, closeSheet]);

  // The whole dex first — it's the default, and every mode offers it.
  const pools = useMemo(() => {
    const list = poolsForMode(mode.id);
    return [
      ...list.filter((p) => p.id === DEFAULT_POOL_ID),
      ...list.filter((p) => p.id !== DEFAULT_POOL_ID),
    ];
  }, [mode.id]);

  const href = `/play/${mode.id}?pool=${poolId}&d=${difficultyId}`;

  // One description of the settings pane, rendered in both the desktop panel and
  // the mobile sheet — so the two can never drift apart.
  const detail = (
    <div className="flex h-full flex-col gap-6">
      <div className="flex items-center gap-4">
        <Pokeball
          className="h-12 w-12 shrink-0 md:h-14 md:w-14"
          topColor={modeBall(mode.id).color}
          label={modeBall(mode.id).name}
        />
        <div>
          <h2 className="text-xl font-black tracking-tight md:text-2xl">{mode.label}</h2>
          <p className="text-sm text-zinc-400">{mode.description}</p>
        </div>
      </div>

      <Field label="범위">
        {pools.length === 1 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-zinc-800 px-3 py-1 text-sm text-zinc-300">
              {pools[0].label} 고정
            </span>
            <span className="text-xs text-zinc-500">
              세대 × 타입 판이라 범위를 좁힐 수 없어요
            </span>
          </div>
        ) : (
          <PoolChips
            pools={pools}
            selectedId={poolId}
            onSelect={setPoolId}
            open={poolsOpen}
            onToggleOpen={() => setPoolsOpen((v) => !v)}
          />
        )}
      </Field>

      <Field label="난이도">
        <div className="flex flex-wrap gap-2">
          {mode.difficulties.map((d) => (
            <Chip
              key={d.id}
              active={d.id === difficultyId}
              onClick={() => setDifficultyId(d.id)}
            >
              {d.label}
            </Chip>
          ))}
        </div>
      </Field>

      <Link
        href={href}
        className="mt-auto rounded-xl bg-poke-500 px-4 py-3.5 text-center text-lg font-bold text-white shadow-lg shadow-poke-500/25 transition hover:bg-poke-400 active:scale-[0.98]"
      >
        시작하기
      </Link>
    </div>
  );

  return (
    <main className="page-enter min-h-[100dvh] bg-zinc-950 text-zinc-100">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-5 pb-6 pt-6 md:px-6 md:pb-10 md:pt-8">
        <h1 className="text-xl font-black tracking-tight md:text-2xl">무엇을 플레이할까요?</h1>
        <AuthStatus />
      </header>

      {/* Desktop: rail + panel. */}
      <div className="mx-auto hidden w-full max-w-5xl grid-cols-[220px_minmax(0,1fr)] gap-8 px-6 pb-16 md:grid">
        <nav aria-label="게임 목록" className="flex flex-col gap-1">
          {MODES.map((m) => {
            const ball = modeBall(m.id);
            const active = m.id === mode.id;
            return (
              <button
                key={m.id}
                type="button"
                aria-current={active || undefined}
                onClick={() => selectMode(m)}
                className={`flex items-center gap-3 rounded-lg border-l-2 px-3 py-2.5 text-left transition ${
                  active
                    ? "border-poke-500 bg-zinc-900 font-bold text-zinc-50"
                    : "border-transparent text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-100"
                }`}
              >
                <Pokeball decorative className="h-6 w-6 shrink-0" topColor={ball.color} />
                <span className="text-sm">{m.label}</span>
              </button>
            );
          })}
        </nav>

        <section
          aria-label={`${mode.label} 설정`}
          className="min-h-[420px] rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6"
        >
          {detail}
        </section>
      </div>

      {/* Mobile: card grid, settings arrive as a sheet. */}
      <div className="grid grid-cols-2 gap-3 px-5 pb-16 md:hidden">
        {MODES.map((m) => {
          const ball = modeBall(m.id);
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => selectMode(m)}
              className="relative flex flex-col items-start gap-1 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 p-3.5 text-left transition active:scale-[0.98]"
            >
              <Pokeball
                decorative
                className="pointer-events-none absolute -bottom-4 -right-3 h-16 w-16 opacity-15"
                topColor={ball.color}
              />
              <span className="text-[15px] font-bold tracking-tight">{m.label}</span>
              <span className="text-xs leading-snug text-zinc-500">{m.description}</span>
            </button>
          );
        })}
      </div>

      {selectedId && (
        <div className="md:hidden">
          <button
            type="button"
            aria-label="닫기"
            onClick={closeSheet}
            className="fixed inset-0 z-40 bg-zinc-950/70"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${mode.label} 설정`}
            className="sheet-rise fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-zinc-800 bg-zinc-900 p-5 pb-7"
          >
            <button
              type="button"
              onClick={closeSheet}
              aria-label="닫기"
              className="absolute right-4 top-4 rounded-full p-1 text-zinc-500 transition hover:text-zinc-200"
            >
              <X className="h-5 w-5" />
            </button>
            {detail}
          </div>
        </div>
      )}
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
        {label}
      </span>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`whitespace-nowrap rounded-full border px-3 py-1 text-sm transition ${
        active
          ? "border-poke-500 bg-poke-500 font-bold text-white"
          : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-100"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * Pools are 28 entries — far too many to lay out flat, and far too few to
 * deserve a separate screen. So: the handful a player reaches for, then the rest
 * on request, split into the two axes they actually come in.
 */
function PoolChips({
  pools,
  selectedId,
  onSelect,
  open,
  onToggleOpen,
}: {
  pools: PoolDef[];
  selectedId: string;
  onSelect: (id: string) => void;
  open: boolean;
  onToggleOpen: () => void;
}) {
  const preview = pools.slice(0, POOL_PREVIEW_COUNT);
  // A pool constrained by type is a type pool; everything else is a generation
  // (or the whole dex). Reading the filter beats matching on id prefixes.
  const generations = pools.filter((p) => !p.filter.types?.length);
  const types = pools.filter((p) => p.filter.types?.length);

  // Keep the current choice visible even when it lives past the preview.
  const selected = pools.find((p) => p.id === selectedId);
  const pinned = selected && !preview.includes(selected) ? selected : undefined;

  if (!open) {
    return (
      <div className="flex flex-wrap gap-2">
        {preview.map((p) => (
          <Chip key={p.id} active={p.id === selectedId} onClick={() => onSelect(p.id)}>
            {p.label}
          </Chip>
        ))}
        {pinned && (
          <Chip active onClick={() => onSelect(pinned.id)}>
            {pinned.label}
          </Chip>
        )}
        <button
          type="button"
          onClick={onToggleOpen}
          className="flex items-center gap-1 rounded-full border border-dashed border-zinc-700 px-3 py-1 text-sm text-zinc-500 transition hover:border-zinc-500 hover:text-zinc-300"
        >
          더보기
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
      <PoolGroup label="세대" pools={generations} selectedId={selectedId} onSelect={onSelect} />
      <PoolGroup label="타입" pools={types} selectedId={selectedId} onSelect={onSelect} />
      <button
        type="button"
        onClick={onToggleOpen}
        className="self-start text-xs text-zinc-500 transition hover:text-zinc-300"
      >
        접기
      </button>
    </div>
  );
}

function PoolGroup({
  label,
  pools,
  selectedId,
  onSelect,
}: {
  label: string;
  pools: PoolDef[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  if (pools.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-600">
        {label}
      </span>
      <div className="flex flex-wrap gap-2">
        {pools.map((p) => (
          <Chip key={p.id} active={p.id === selectedId} onClick={() => onSelect(p.id)}>
            {p.label}
          </Chip>
        ))}
      </div>
    </div>
  );
}
