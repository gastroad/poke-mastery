"use client";

import { Heart } from "lucide-react";
import Image from "next/image";
import { useMemo } from "react";
import { INITIAL_LIVES, useSessionStore } from "@/client/stores/sessionStore";
import { HEAVIER_ANSWER } from "@/domain/challenge/generateHeavierQuestions";
import type { Pokemon } from "@/domain/pokemon/types";
import { spritePath } from "@/shared/sprites";
import { POKEMON } from "./pokemonDataset";

/** PokéAPI reports weight in hectograms and height in decimetres. */
const kg = (hg: number) => (hg / 10).toLocaleString("ko-KR", { maximumFractionDigits: 1 });
const metres = (dm: number) => (dm / 10).toFixed(1);

/**
 * "Which of these two is heavier?" — two Pokémon, one tap.
 *
 * Names are shown: the question is about weight, not about recognising the
 * sprite. Size is a fair hint most of the time and a trap the rest — 고오스 is
 * 1.3m and 0.1kg — which is where the mode gets its teeth. On reveal both
 * weights are shown so the surprise is worth something next time.
 *
 * Drives the ordinary quiz flow in the store (lives, combo, reveal→next); a tap
 * fills in the answer the same way typing would.
 */
export function HeavierQuizView() {
  const questions = useSessionStore((s) => s.questions);
  const currentIndex = useSessionStore((s) => s.currentIndex);
  const phase = useSessionStore((s) => s.phase);
  const lastResult = useSessionStore((s) => s.lastResult);
  const lives = useSessionStore((s) => s.lives);
  const combo = useSessionStore((s) => s.combo);
  const setInput = useSessionStore((s) => s.setInput);
  const submit = useSessionStore((s) => s.submit);
  const next = useSessionStore((s) => s.next);

  const byId = useMemo(() => new Map(POKEMON.map((p) => [p.id, p])), []);
  const question = questions[currentIndex];
  const left = question ? byId.get(question.pokemonId) : undefined;
  const right = question?.pairId ? byId.get(question.pairId) : undefined;
  if (!question || !left || !right) return null;

  const revealed = phase === "revealed";
  const isLast = currentIndex + 1 >= questions.length;
  const heavier = left.weightHg > right.weightHg ? left : right;

  function answer(side: "left" | "right") {
    if (revealed) return;
    setInput(HEAVIER_ANSWER[side]);
    submit();
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-xl flex-col gap-4 bg-zinc-950 px-4 py-5 text-zinc-100">
      <header className="flex items-center justify-between text-sm">
        <span className="font-black">
          {currentIndex + 1}
          <span className="text-zinc-500"> / {questions.length}</span>
        </span>
        <div className="flex items-center gap-3">
          {combo > 1 && <span className="font-bold text-amber-400">{combo} 연속</span>}
          <span className="flex gap-0.5">
            {Array.from({ length: INITIAL_LIVES }, (_, i) => (
              <Heart
                key={i}
                className={`h-4 w-4 ${i < lives ? "fill-poke-500 text-poke-500" : "text-zinc-700"}`}
              />
            ))}
          </span>
        </div>
      </header>

      <p className="text-center text-lg font-black">어느 쪽이 더 무거울까요?</p>

      <div className="grid grid-cols-2 gap-3">
        {(["left", "right"] as const).map((side) => {
          const mon = side === "left" ? left : right;
          const won = revealed && mon.id === heavier.id;
          return (
            <button
              key={side}
              type="button"
              disabled={revealed}
              onClick={() => answer(side)}
              className={`flex flex-col items-center gap-2 rounded-2xl p-4 transition ${
                revealed
                  ? won
                    ? "bg-emerald-500/20 ring-2 ring-emerald-400"
                    : "bg-zinc-900 opacity-60"
                  : "bg-zinc-900 hover:bg-zinc-800 active:scale-[0.98]"
              }`}
            >
              <Image
                src={spritePath(mon.id, "pixel")}
                alt={mon.nameKo}
                width={96}
                height={96}
                unoptimized
                priority
                className="h-28 w-28 [image-rendering:pixelated] sm:h-36 sm:w-36"
              />
              <span className="font-black">{mon.nameKo}</span>
              {revealed ? (
                <Facts mon={mon} />
              ) : (
                <span className="text-xs text-zinc-500">?</span>
              )}
            </button>
          );
        })}
      </div>

      {revealed && (
        <div className="flex flex-col gap-3">
          <p
            className={`text-center text-xl font-black ${
              lastResult === "correct" ? "text-emerald-400" : "text-poke-500"
            }`}
          >
            {lastResult === "correct" ? "정답!" : "아쉬워요"}
            <span className="ml-2 text-base font-bold text-zinc-300">
              {heavier.nameKo}가 {kg(heavier.weightHg)}kg으로 더 무겁습니다
            </span>
          </p>
          <button
            type="button"
            onClick={next}
            autoFocus
            className="rounded-xl bg-poke-500 px-4 py-3 text-lg font-bold text-white transition hover:bg-poke-400 active:scale-[0.98]"
          >
            {isLast || lives <= 0 ? "결과 보기" : "다음"}
          </button>
        </div>
      )}
    </main>
  );
}

/** Height is shown alongside the weight because the gap between them is the
    lesson — a tall Pokémon is not always the heavy one. */
function Facts({ mon }: { mon: Pokemon }) {
  return (
    <span className="flex flex-col items-center">
      <span className="text-lg font-black text-zinc-100">{kg(mon.weightHg)}kg</span>
      <span className="text-xs text-zinc-500">{metres(mon.heightDm)}m</span>
    </span>
  );
}
