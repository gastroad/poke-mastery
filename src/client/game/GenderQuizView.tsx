"use client";

import { Heart } from "lucide-react";
import Image from "next/image";
import { useMemo } from "react";
import { INITIAL_LIVES, useSessionStore } from "@/client/stores/sessionStore";
import { GENDER_ANSWER } from "@/domain/challenge/generateGenderQuestions";
import { spritePath } from "@/shared/sprites";
import { POKEMON } from "./pokemonDataset";

/**
 * "Male or female?" — the front AND back sprites of one gender, two buttons.
 *
 * Both views are shown because a fair few species (브이젤, 스라크…) are identical
 * from the front and only differ from behind. After answering, the two genders
 * are put side by side so the difference is actually learned, not just scored.
 *
 * This drives the ordinary quiz flow in the store (lives, combo, reveal→next);
 * a tap just fills in the answer the same way typing would.
 */
export function GenderQuizView() {
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
  const mon = question ? byId.get(question.pokemonId) : undefined;
  if (!question || !mon) return null;

  const revealed = phase === "revealed";
  const isLast = currentIndex + 1 >= questions.length;
  const shown = question.gender ?? "male";
  const hasBack = mon.genderDiff?.back !== null && mon.genderDiff?.back !== undefined;

  function answer(gender: "male" | "female") {
    if (revealed) return;
    setInput(GENDER_ANSWER[gender]);
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

      <p className="text-center text-lg font-black">이 포켓몬은 암컷일까요, 수컷일까요?</p>

      {/* The question: one gender, front and back. The name is shown — this asks
          about the gender, not about identifying the Pokémon. */}
      <div className="flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 py-4">
        <Sprite
          id={mon.id}
          gender={shown}
          back={false}
          alt={`${mon.nameKo} 앞모습`}
          label="앞모습"
        />
        {hasBack && (
          <Sprite id={mon.id} gender={shown} back alt={`${mon.nameKo} 뒷모습`} label="뒷모습" />
        )}
      </div>
      <p className="text-center text-sm text-zinc-400">{mon.nameKo}</p>

      {revealed ? (
        <div className="flex flex-col gap-3">
          <p
            className={`text-center text-xl font-black ${
              lastResult === "correct" ? "text-emerald-400" : "text-poke-500"
            }`}
          >
            {lastResult === "correct" ? "정답!" : `아쉬워요 — ${question.answer}`}
          </p>
          {/* The learning moment: both genders side by side. */}
          <div className="flex items-stretch justify-center gap-2 rounded-2xl bg-zinc-900 py-4">
            <Sprite id={mon.id} gender="male" back={false} alt="수컷" label="수컷" big />
            <Sprite id={mon.id} gender="female" back={false} alt="암컷" label="암컷" big />
          </div>
          {hasBack && (
            <div className="flex items-stretch justify-center gap-2 rounded-2xl bg-zinc-900 py-4">
              <Sprite id={mon.id} gender="male" back alt="수컷 뒷모습" label="수컷 뒤" big />
              <Sprite id={mon.id} gender="female" back alt="암컷 뒷모습" label="암컷 뒤" big />
            </div>
          )}
          <button
            type="button"
            onClick={next}
            autoFocus
            className="rounded-xl bg-poke-500 px-4 py-3 text-lg font-bold text-white transition hover:bg-poke-400 active:scale-[0.98]"
          >
            {isLast || lives <= 0 ? "결과 보기" : "다음"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => answer("female")}
            className="rounded-xl bg-pink-500/20 px-4 py-5 text-xl font-black text-pink-300 transition hover:bg-pink-500/30 active:scale-[0.98]"
          >
            암컷 ♀
          </button>
          <button
            type="button"
            onClick={() => answer("male")}
            className="rounded-xl bg-sky-500/20 px-4 py-5 text-xl font-black text-sky-300 transition hover:bg-sky-500/30 active:scale-[0.98]"
          >
            수컷 ♂
          </button>
        </div>
      )}
    </main>
  );
}

function Sprite({
  id,
  gender,
  back,
  alt,
  label,
  big = false,
}: {
  id: number;
  gender: "male" | "female";
  back: boolean;
  alt: string;
  label: string;
  big?: boolean;
}) {
  const variant = back
    ? gender === "female"
      ? "pixel-back-female"
      : "pixel-back"
    : gender === "female"
      ? "pixel-female"
      : "pixel";
  return (
    <figure className="flex flex-col items-center gap-1">
      <Image
        src={spritePath(id, variant)}
        alt={alt}
        width={96}
        height={96}
        unoptimized
        className={`[image-rendering:pixelated] ${big ? "h-28 w-28 sm:h-36 sm:w-36" : "h-32 w-32 sm:h-44 sm:w-44"}`}
      />
      <figcaption className="text-xs text-zinc-500">{label}</figcaption>
    </figure>
  );
}
