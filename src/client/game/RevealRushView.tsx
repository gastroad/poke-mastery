"use client";

import { useEffect, useRef, useState } from "react";
import { useSessionStore } from "@/client/stores/sessionStore";
import { judgeAnswer } from "@/domain/answer/judgeAnswer";
import { PokemonSilhouette } from "./PokemonSilhouette";

// Tunable — the user adjusts these by feel.
const MAX_POINTS = 100; // guess instantly (fully hidden)
const MIN_POINTS = 20; // guess just before full reveal

/** Reveal-rush loop: each silhouette fades in over `revealSec`; earlier guess = more points. */
export function RevealRushView({ revealSec = 6 }: { revealSec?: number }) {
  const questions = useSessionStore((s) => s.questions);
  const currentIndex = useSessionStore((s) => s.currentIndex);
  const input = useSessionStore((s) => s.input);
  const score = useSessionStore((s) => s.score);
  const setInput = useSessionStore((s) => s.setInput);
  const recordAndAdvance = useSessionStore((s) => s.recordAndAdvance);

  const question = questions[currentIndex];
  const inputRef = useRef<HTMLInputElement>(null);
  const composingRef = useRef(false); // true while a Hangul syllable is mid-composition
  const startRef = useRef<number>(0); // set to Date.now() when each question starts
  // Reveal only once the new question's silhouette has painted (avoids a flash).
  const [revealedIndex, setRevealedIndex] = useState(-1);

  useEffect(() => {
    startRef.current = Date.now();
    const raf = requestAnimationFrame(() => setRevealedIndex(currentIndex));
    const cutoff = setTimeout(() => recordAndAdvance(false, 0), revealSec * 1000);
    inputRef.current?.focus();
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(cutoff);
    };
  }, [currentIndex, revealSec, recordAndAdvance]);

  if (!question) return null;

  const pointsForNow = () => {
    const t = Math.min(1, Math.max(0, (Date.now() - startRef.current) / 1000 / revealSec));
    return Math.round(MAX_POINTS - (MAX_POINTS - MIN_POINTS) * t);
  };

  // Skip the match check mid-composition so the final Hangul character isn't missed.
  const tryCommit = (value: string) => {
    if (judgeAnswer(value, question.acceptedAnswers)) recordAndAdvance(true, pointsForNow());
  };
  const onChange = (value: string) => {
    setInput(value);
    if (!composingRef.current) tryCommit(value);
  };
  const onCompositionEnd = (value: string) => {
    composingRef.current = false;
    setInput(value);
    tryCommit(value);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    recordAndAdvance(false, 0); // give up on this one
  };

  return (
    <main className="flex min-h-[100dvh] flex-1 flex-col items-center justify-start bg-zinc-950 px-6 py-6 text-zinc-100 sm:justify-center sm:py-10">
      <div className="flex w-full max-w-md flex-col items-center gap-5 sm:gap-6">
        <div className="flex w-full items-center justify-between text-sm">
          <span className="font-mono text-zinc-400">
            {currentIndex + 1} / {questions.length}
          </span>
          <span className="text-lg font-bold text-poke-400">{score}</span>
        </div>

        <PokemonSilhouette
          pokemonId={question.pokemonId}
          brightness={revealedIndex === currentIndex ? 1 : 0}
          transitionSec={revealSec}
        />

        <form onSubmit={onSubmit} className="flex w-full flex-col gap-3">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => onChange(e.target.value)}
            onCompositionStart={() => {
              composingRef.current = true;
            }}
            onCompositionEnd={(e) => onCompositionEnd(e.currentTarget.value)}
            placeholder="이름을 입력하세요"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint="next"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-center text-lg outline-none focus:border-poke-400"
          />
          <button
            type="submit"
            className="w-full rounded-xl border border-zinc-700 px-4 py-3 text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-200"
          >
            모르겠어요 (넘기기)
          </button>
        </form>
      </div>
    </main>
  );
}
