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
  const onChange = (value: string) => {
    setInput(value);
    if (judgeAnswer(value, question.acceptedAnswers)) recordAndAdvance(true);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    recordAndAdvance(false); // Enter = give up on this one, next
  };

  const secondsLeft = Math.ceil(msLeft / 1000);
  const timePct = Math.max(0, (msLeft / (timeLimitSec * 1000)) * 100);
  const low = secondsLeft <= 10;

  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center bg-slate-950 px-6 py-10 text-slate-100">
      <div className="flex w-full max-w-md flex-col items-center gap-6">
        <div className="flex w-full items-center justify-between">
          <span
            className={`flex items-center gap-1.5 font-mono text-lg font-bold ${low ? "text-rose-400" : "text-slate-200"}`}
          >
            <Timer className="h-5 w-5" />
            {secondsLeft}s
          </span>
          <span className="text-lg font-bold text-indigo-400">{correctCount}</span>
          <span className="flex items-center gap-1 font-semibold text-amber-400">
            {combo >= 2 && (
              <>
                <Flame className="h-4 w-4" />
                {combo}
              </>
            )}
          </span>
        </div>

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className={`h-full rounded-full ${low ? "bg-rose-500" : "bg-indigo-500"}`}
            style={{ width: `${timePct}%` }}
          />
        </div>

        <PokemonSilhouette pokemonId={question.pokemonId} revealed={false} />

        <form onSubmit={onSubmit} className="flex w-full flex-col gap-3">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => onChange(e.target.value)}
            placeholder="이름을 입력하세요"
            autoComplete="off"
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-center text-lg outline-none focus:border-indigo-400"
          />
          <button
            type="submit"
            className="w-full rounded-xl border border-slate-700 px-4 py-3 text-slate-400 transition hover:bg-slate-900 hover:text-slate-200"
          >
            모르겠어요 (넘기기)
          </button>
        </form>
      </div>
    </main>
  );
}
