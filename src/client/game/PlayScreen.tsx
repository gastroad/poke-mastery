"use client";

import { Flame, Heart } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { INITIAL_LIVES, useSessionStore } from "@/client/stores/sessionStore";
import { BEGINNER_CHALLENGE } from "@/domain/challenge/catalog";
import { POKEMON } from "./pokemonDataset";
import { PokemonSilhouette } from "./PokemonSilhouette";
import { ResultScreen } from "./ResultScreen";

const randomSeed = () => Math.floor(Math.random() * 0x7fffffff);

/**
 * Top-level play orchestrator. Picks a seed once (client session state — the
 * "no Math.random" rule applies only to domain/), starts the game, and renders
 * the right screen for the current status. All rules live in the store/domain.
 */
export function PlayScreen() {
  const status = useSessionStore((s) => s.status);
  const start = useSessionStore((s) => s.start);
  const [seed] = useState(randomSeed);

  useEffect(() => {
    start(BEGINNER_CHALLENGE, POKEMON, seed);
  }, [start, seed]);

  if (status === "finished") return <ResultScreen />;
  if (status === "playing") return <PlayingView />;
  return null; // "idle": the single frame before start() runs
}

function PlayingView() {
  const questions = useSessionStore((s) => s.questions);
  const currentIndex = useSessionStore((s) => s.currentIndex);
  const input = useSessionStore((s) => s.input);
  const phase = useSessionStore((s) => s.phase);
  const lastResult = useSessionStore((s) => s.lastResult);
  const setInput = useSessionStore((s) => s.setInput);
  const submit = useSessionStore((s) => s.submit);
  const next = useSessionStore((s) => s.next);

  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const question = questions[currentIndex];
  const revealed = phase === "revealed";
  const isLastQuestion = currentIndex + 1 >= questions.length;

  // Keep focus where the next keystroke should go: input while answering,
  // the button while revealed (so Enter advances).
  useEffect(() => {
    if (revealed) buttonRef.current?.focus();
    else inputRef.current?.focus();
  }, [currentIndex, revealed]);

  if (!question) return null;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (revealed) next();
    else submit();
  };

  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center bg-slate-950 px-6 py-10 text-slate-100">
      <div className="flex w-full max-w-md flex-col items-center gap-8">
        <Hud />
        <PokemonSilhouette pokemonId={question.pokemonId} revealed={revealed} />

        <div className="flex h-8 items-center">
          {revealed && (
            <p className={`text-xl font-bold ${lastResult === "correct" ? "text-emerald-400" : "text-rose-400"}`}>
              {lastResult === "correct" ? "정답!" : "오답"} · {question.answer}
            </p>
          )}
        </div>

        <form onSubmit={onSubmit} className="flex w-full flex-col gap-3">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={revealed}
            placeholder="이 포켓몬의 이름은?"
            autoComplete="off"
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-center text-lg outline-none focus:border-indigo-400 disabled:opacity-60"
          />
          <button
            ref={buttonRef}
            type="submit"
            className="w-full rounded-xl bg-indigo-500 px-4 py-3 text-lg font-semibold text-white transition hover:bg-indigo-400 active:scale-[0.98]"
          >
            {revealed ? (isLastQuestion ? "결과 보기" : "다음") : "확인"}
          </button>
        </form>
      </div>
    </main>
  );
}

function Hud() {
  const lives = useSessionStore((s) => s.lives);
  const combo = useSessionStore((s) => s.combo);
  const currentIndex = useSessionStore((s) => s.currentIndex);
  const total = useSessionStore((s) => s.questions.length);

  const remaining = Math.max(lives, 0);
  const lost = Math.max(INITIAL_LIVES - remaining, 0);

  return (
    <div className="flex w-full items-center justify-between text-sm">
      <span className="flex items-center gap-1" aria-label={`남은 목숨 ${remaining}`}>
        {Array.from({ length: remaining }).map((_, i) => (
          <Heart key={`life-${i}`} className="h-5 w-5 fill-rose-500 text-rose-500" />
        ))}
        {Array.from({ length: lost }).map((_, i) => (
          <Heart key={`lost-${i}`} className="h-5 w-5 text-slate-700" />
        ))}
      </span>
      <span className="font-mono text-slate-400">
        {currentIndex + 1} / {total}
      </span>
      <span className="flex items-center gap-1 font-semibold text-amber-400">
        {combo >= 2 && (
          <>
            <Flame className="h-4 w-4" />
            {combo}
          </>
        )}
      </span>
    </div>
  );
}
