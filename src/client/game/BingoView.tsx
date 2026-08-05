"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { useSessionStore } from "@/client/stores/sessionStore";
import { cellsOf } from "@/domain/bingo/cellAnswers";
import { completedLines } from "@/domain/bingo/lines";
import { findByAnswer } from "@/domain/bingo/placement";
import { TYPE_NAME_KO } from "@/domain/pokemon/typeNames";
import { spritePath } from "@/shared/sprites";
import { withParticle } from "./korean";
import { POKEMON } from "./pokemonDataset";

/**
 * The bingo board. Type a name to pick a Pokémon up, then tap the cell you want
 * it in — that tap is the attempt, and a wrong cell costs one. Cells are never
 * highlighted to show where a Pokémon would fit: knowing the name isn't enough,
 * you have to know its generation and typing.
 *
 * All rules live in domain/bingo; this reads session state and renders it.
 */
export function BingoView() {
  const board = useSessionStore((s) => s.board);
  const placed = useSessionStore((s) => s.placed);
  const held = useSessionStore((s) => s.held);
  const attemptsLeft = useSessionStore((s) => s.attemptsLeft);
  const lastPlacement = useSessionStore((s) => s.lastPlacement);
  const pickUp = useSessionStore((s) => s.pickUp);
  const dropHeld = useSessionStore((s) => s.dropHeld);

  const [input, setInput] = useState("");
  const [rejection, setRejection] = useState<string | null>(null);
  /** Which cell the last drop aimed at — the verdict alone doesn't say. */
  const [lastCell, setLastCell] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const byId = useMemo(() => new Map(POKEMON.map((p) => [p.id, p])), []);
  const cells = useMemo(() => (board ? cellsOf(board) : []), [board]);
  const lineCells = useMemo(() => {
    if (!board) return new Set<number>();
    return new Set(completedLines(board.size, placed.map((id) => id !== null)).flat());
  }, [board, placed]);

  if (!board) return null;
  const filledCount = placed.filter((id) => id !== null).length;

  /** Picking up is free — only dropping into a cell spends an attempt. */
  function handlePickUp(e: React.FormEvent) {
    e.preventDefault();
    const found = findByAnswer(POKEMON, input);
    if (!found) {
      setRejection(`"${input.trim()}" — 그런 이름의 포켓몬이 없어요`);
      return;
    }
    if (placed.includes(found.id)) {
      setRejection(`${withParticle(found.nameKo, "은", "는")} 이미 판에 있어요`);
      return;
    }
    setRejection(null);
    setInput("");
    pickUp(found);
  }

  function handleDrop(index: number) {
    setRejection(null);
    setLastCell(index);
    dropHeld(index, POKEMON);
    inputRef.current?.focus();
  }

  function cellLabel(index: number | null): string {
    const cell = index === null ? undefined : cells[index];
    return cell ? `${cell.generation}세대 · ${TYPE_NAME_KO[cell.type]}` : "그";
  }

  const message = rejection ?? describePlacement();
  function describePlacement(): string | null {
    if (!lastPlacement) return held ? `${held.nameKo} — 넣을 칸을 고르세요` : null;
    if (lastPlacement.kind === "placed") {
      const mon = byId.get(lastPlacement.pokemonId);
      return mon ? `${mon.nameKo} → ${cellLabel(lastCell)}` : null;
    }
    if (lastPlacement.kind === "mismatch") {
      const mon = byId.get(lastPlacement.pokemonId);
      if (!mon) return null;
      const types = mon.types.map((t) => TYPE_NAME_KO[t]).join("/");
      return `${withParticle(mon.nameKo, "은", "는")} ${mon.generation}세대 · ${types} — ${cellLabel(lastCell)} 칸에는 안 맞아요`;
    }
    return null;
  }
  const messageTone =
    rejection || lastPlacement?.kind === "mismatch"
      ? "bg-poke-500/15 text-poke-400"
      : lastPlacement?.kind === "placed"
        ? "bg-emerald-500/15 text-emerald-300"
        : "bg-zinc-900 text-zinc-300";

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-2xl flex-col gap-3 bg-zinc-950 px-4 py-5 text-zinc-100">
      <header className="flex items-baseline justify-between gap-3">
        <h1 className="text-lg font-black tracking-tight">
          세대 <span className="text-poke-500">×</span> 타입 빙고
        </h1>
        <div className="flex gap-3 text-sm">
          <Stat label="시도" value={attemptsLeft} warn={attemptsLeft <= 3} />
          <Stat label="칸" value={`${filledCount}/${cells.length}`} />
          <Stat label="줄" value={lineCells.size > 0 ? completedLineCount(board.size, placed) : 0} />
        </div>
      </header>

      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `minmax(2.5rem,auto) repeat(${board.size}, minmax(0,1fr))` }}
      >
        <div />
        {board.types.map((t) => (
          <div
            key={t}
            className="flex items-center justify-center rounded-lg bg-poke-500/15 px-1 py-2 text-center text-xs font-bold text-poke-400 sm:text-sm"
          >
            {TYPE_NAME_KO[t]}
          </div>
        ))}
        {board.generations.map((g, row) => (
          <GridRow key={g}>
            <div className="flex items-center justify-center rounded-lg bg-zinc-800 px-1 text-xs font-bold text-zinc-300 sm:text-sm">
              {g}세대
            </div>
            {board.types.map((t, col) => {
              const index = row * board.size + col;
              const id = placed[index];
              const mon = id !== null ? byId.get(id) : undefined;
              return (
                <button
                  key={t}
                  type="button"
                  disabled={!held || id !== null}
                  onClick={() => handleDrop(index)}
                  aria-label={`${g}세대 ${TYPE_NAME_KO[t]}${mon ? ` — ${mon.nameKo}` : ""}`}
                  className={`flex aspect-square items-center justify-center rounded-lg transition ${
                    lineCells.has(index)
                      ? "bg-poke-500/25 ring-2 ring-poke-500"
                      : mon
                        ? "bg-zinc-800"
                        : "bg-zinc-900"
                  } ${held && !mon ? "cursor-pointer hover:bg-zinc-700" : ""}`}
                >
                  {mon && (
                    <span className="flex w-full flex-col items-center gap-0.5">
                      <Image
                        src={spritePath(mon.id, "pixel")}
                        alt=""
                        width={96}
                        height={96}
                        unoptimized
                        className="h-14 w-14 [image-rendering:pixelated] sm:h-20 sm:w-20"
                      />
                      <span className="max-w-full truncate px-1 text-[11px] font-bold text-zinc-300 sm:text-xs">
                        {mon.nameKo}
                      </span>
                    </span>
                  )}
                </button>
              );
            })}
          </GridRow>
        ))}
      </div>

      <div className="flex min-h-16 items-center gap-3 rounded-xl bg-zinc-900 p-3">
        {held ? (
          <>
            <Image
              src={spritePath(held.id, "pixel")}
              alt=""
              width={96}
              height={96}
              unoptimized
              className="h-14 w-14 shrink-0 [image-rendering:pixelated]"
            />
            <div>
              <div className="font-black">{held.nameKo}</div>
              <div className="text-xs text-zinc-400">넣을 칸을 탭하세요</div>
            </div>
            <button
              type="button"
              onClick={() => pickUp(null)}
              className="ml-auto rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-400"
            >
              취소
            </button>
          </>
        ) : (
          <form onSubmit={handlePickUp} className="flex w-full gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="포켓몬 이름"
              autoComplete="off"
              enterKeyHint="done"
              className="min-w-0 flex-1 rounded-lg bg-zinc-800 px-3 py-2 outline-none placeholder:text-zinc-600 focus:ring-2 focus:ring-poke-500/40"
            />
            <button
              type="submit"
              className="rounded-lg bg-poke-500 px-4 py-2 text-sm font-bold text-white"
            >
              집기
            </button>
          </form>
        )}
      </div>

      {message && <p className={`rounded-lg px-3 py-2 text-sm ${messageTone}`}>{message}</p>}
    </main>
  );
}

function completedLineCount(size: number, placed: readonly (number | null)[]): number {
  return completedLines(size, placed.map((id) => id !== null)).length;
}

/** Cells are flattened into the parent grid, so a row is just a fragment. */
function GridRow({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function Stat({ label, value, warn }: { label: string; value: React.ReactNode; warn?: boolean }) {
  return (
    <span className="flex items-baseline gap-1">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className={`font-black ${warn ? "text-poke-500" : "text-zinc-100"}`}>{value}</span>
    </span>
  );
}
