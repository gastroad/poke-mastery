"use client";

import { Flame, Timer } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSessionStore } from "@/client/stores/sessionStore";
import { judgeAnswer } from "@/domain/answer/judgeAnswer";
import { PokemonSilhouette } from "./PokemonSilhouette";

/** Time-attack loop: one global countdown, guess as many as possible. */
export function TimeAttackView({ timeLimitSec }: { timeLimitSec: number }) {
  const questions = useSessionStore((s) => s.questions);
  const currentIndex = useSessionStore((s) => s.currentIndex);
  const input = useSessionStore((s) => s.input);
  const combo = useSessionStore((s) => s.combo);
  const results = useSessionStore((s) => s.results);
  const setInput = useSessionStore((s) => s.setInput);
  const recordAndAdvance = useSessionStore((s) => s.recordAndAdvance);
  const finishNow = useSessionStore((s) => s.finishNow);

  const question = questions[currentIndex];
  const correctCount = results.filter((r) => r.correct).length;

  const inputRef = useRef<HTMLInputElement>(null);
  const composingRef = useRef(false); // true while a Hangul syllable is mid-composition
  const [deadline] = useState(() => Date.now() + timeLimitSec * 1000);
  const [msLeft, setMsLeft] = useState(timeLimitSec * 1000);

  // Global countdown; when it hits 0 the game ends.
  useEffect(() => {
    const id = setInterval(() => {
      const left = deadline - Date.now();
      if (left <= 0) {
        setMsLeft(0);
        clearInterval(id);
        finishNow();
      } else {
        setMsLeft(left);
      }
    }, 100);
    return () => clearInterval(id);
  }, [deadline, finishNow]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [currentIndex]);

  if (!question) return null;

  // Auto-advance the instant the typed text matches — the time-attack "feel".
  // Skip the check mid-composition so the final Hangul character isn't missed.
  const tryCommit = (value: string) => {
    if (judgeAnswer(value, question.acceptedAnswers)) recordAndAdvance(true);
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
    recordAndAdvance(false); // Enter = give up on this one, next
  };

  const secondsLeft = Math.ceil(msLeft / 1000);
  const timePct = Math.max(0, (msLeft / (timeLimitSec * 1000)) * 100);
  const low = secondsLeft <= 10;

  return (
    <main className="flex min-h-[100dvh] flex-1 flex-col items-center justify-start bg-zinc-950 px-6 py-6 text-zinc-100 sm:justify-center sm:py-10">
      <div className="flex w-full max-w-md flex-col items-center gap-5 sm:gap-6">
        <div className="flex w-full items-center justify-between">
          <span
            className={`flex items-center gap-1.5 font-mono text-lg font-bold ${low ? "text-rose-400" : "text-zinc-200"}`}
          >
            <Timer className="h-5 w-5" />
            {secondsLeft}s
          </span>
          <span className="text-lg font-bold text-poke-400">{correctCount}</span>
          <span className="flex items-center gap-1 font-semibold text-amber-400">
            {combo >= 2 && (
              <>
                <Flame className="h-4 w-4" />
                {combo}
              </>
            )}
          </span>
        </div>

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className={`h-full rounded-full ${low ? "bg-rose-500" : "bg-poke-500"}`}
            style={{ width: `${timePct}%` }}
          />
        </div>

        <PokemonSilhouette pokemonId={question.pokemonId} brightness={0} />

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
