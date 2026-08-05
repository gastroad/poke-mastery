"use client";

import { Flame, Heart } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { INITIAL_LIVES, type StartChallenge, useSessionStore } from "@/client/stores/sessionStore";
import { BingoView } from "./BingoView";
import { GenderQuizView } from "./GenderQuizView";
import { HeavierQuizView } from "./HeavierQuizView";
import { POKEMON } from "./pokemonDataset";
import { PokemonSilhouette } from "./PokemonSilhouette";
import { ResultScreen } from "./ResultScreen";
import { RevealRushView } from "./RevealRushView";
import { TimeAttackView } from "./TimeAttackView";

const randomSeed = () => Math.floor(Math.random() * 0x7fffffff);

/**
 * Top-level play orchestrator. Picks a seed once (client session state — the
 * "no Math.random" rule applies only to domain/), starts the game, and renders
 * the right screen for the current status. All rules live in the store/domain.
 */
export function PlayScreen({ challenge }: { challenge: StartChallenge }) {
  const status = useSessionStore((s) => s.status);
  const start = useSessionStore((s) => s.start);
  const [seed] = useState(randomSeed);

  useEffect(() => {
    start(challenge, POKEMON, seed);
  }, [start, seed, challenge]);

  if (status === "finished") return <ResultScreen />;
  if (status === "playing") {
    if (challenge.rule.mode === "bingo") return <BingoView />;
    if (challenge.rule.mode === "gender") return <GenderQuizView />;
    if (challenge.rule.mode === "heavier") return <HeavierQuizView />;
    if (challenge.rule.mode === "time-attack") {
      return <TimeAttackView timeLimitSec={challenge.rule.timeLimitSec ?? 60} />;
    }
    if (challenge.rule.mode === "reveal-rush") {
      return <RevealRushView revealSec={challenge.rule.revealSec ?? 6} />;
    }
    return <PlayingView />;
  }
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

  const question = questions[currentIndex];
  const revealed = phase === "revealed";
  const isLastQuestion = currentIndex + 1 >= questions.length;

  // Keep the input focused across questions AND the reveal so the mobile
  // keyboard never closes/reopens (Enter submits, then advances).
  useEffect(() => {
    inputRef.current?.focus();
  }, [currentIndex]);

  if (!question) return null;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (revealed) next();
    else submit();
  };

  return (
    <main className="flex min-h-[100dvh] flex-1 flex-col items-center justify-start bg-zinc-950 px-6 py-6 text-zinc-100 sm:justify-center sm:py-10">
      <div className="flex w-full max-w-md flex-col items-center gap-6 sm:gap-8">
        <Hud />
        <PokemonSilhouette pokemonId={question.pokemonId} brightness={revealed ? 1 : 0} />

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
            placeholder="이 포켓몬의 이름은?"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint={revealed ? "next" : "done"}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-center text-lg outline-none focus:border-poke-400"
          />
          <button
            type="submit"
            className="w-full rounded-xl bg-poke-500 px-4 py-3 text-lg font-semibold text-white transition hover:bg-poke-400 active:scale-[0.98]"
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
          <Heart key={`lost-${i}`} className="h-5 w-5 text-zinc-700" />
        ))}
      </span>
      <span className="font-mono text-zinc-400">
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
