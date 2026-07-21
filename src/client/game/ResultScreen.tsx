"use client";

import Link from "next/link";
import { useSessionStore } from "@/client/stores/sessionStore";
import { POKEMON } from "./pokemonDataset";

const randomSeed = () => Math.floor(Math.random() * 0x7fffffff);

/** End-of-game summary. "다시 하기" replays the same rule with a fresh seed. */
export function ResultScreen() {
  const results = useSessionStore((s) => s.results);
  const questions = useSessionStore((s) => s.questions);
  const maxCombo = useSessionStore((s) => s.maxCombo);
  const rule = useSessionStore((s) => s.rule);
  const start = useSessionStore((s) => s.start);

  const correct = results.filter((r) => r.correct).length;
  const total = questions.length;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center bg-slate-950 px-6 py-10 text-center text-slate-100">
      <div className="flex w-full max-w-md flex-col items-center gap-8">
        <h1 className="text-3xl font-bold">게임 종료</h1>

        <div className="flex flex-col gap-2">
          <p className="text-6xl font-black text-indigo-400">
            {correct}
            <span className="text-2xl text-slate-500"> / {total}</span>
          </p>
          <p className="text-slate-400">
            정답률 {pct}% · 최고 콤보 🔥 {maxCombo}
          </p>
        </div>

        <div className="flex w-full flex-col gap-3">
          <button
            type="button"
            onClick={() => rule && start(rule, POKEMON, randomSeed())}
            className="w-full rounded-xl bg-indigo-500 px-4 py-3 text-lg font-semibold text-white transition hover:bg-indigo-400 active:scale-[0.98]"
          >
            다시 하기
          </button>
          <Link
            href="/"
            className="w-full rounded-xl border border-slate-700 px-4 py-3 text-slate-300 transition hover:bg-slate-900"
          >
            홈으로
          </Link>
        </div>
      </div>
    </main>
  );
}
