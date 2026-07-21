"use client";

import { Cloud, Flame, HardDrive, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { submitPlayAction } from "@/app/play/actions";
import { useSessionStore } from "@/client/stores/sessionStore";
import { gradePlay } from "@/domain/challenge/gradePlay";
import { applyPlayResult } from "@/domain/progress/applyPlayResult";
import type { ProgressDelta } from "@/domain/progress/types";
import type { PlayRecord } from "@/shared/play";
import { readLocalProgress, writeLocalProgress } from "./localProgress";
import { POKEMON } from "./pokemonDataset";

const randomSeed = () => Math.floor(Math.random() * 0x7fffffff);

type SaveState =
  | { kind: "saving" }
  | { kind: "saved"; delta: ProgressDelta; where: "server" | "local" }
  | { kind: "none"; reason: string };

/** End-of-game summary. Submits the play (server if logged in, else localStorage). */
export function ResultScreen() {
  const results = useSessionStore((s) => s.results);
  const questions = useSessionStore((s) => s.questions);
  const maxCombo = useSessionStore((s) => s.maxCombo);
  const challenge = useSessionStore((s) => s.challenge);
  const seed = useSessionStore((s) => s.seed);
  const start = useSessionStore((s) => s.start);

  const correct = results.filter((r) => r.correct).length;
  const total = questions.length;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

  const [save, setSave] = useState<SaveState>({ kind: "saving" });
  const savedSeed = useRef<number | null>(null);

  // Submit once per finished game (guarded by seed; anti-replay index guards the server too).
  useEffect(() => {
    if (!challenge || savedSeed.current === seed) return;
    savedSeed.current = seed;

    const record: PlayRecord = { challengeId: challenge.id, seed, attempts: results.map((r) => r.input) };

    submitPlayAction(record)
      .then((res) => {
        if (res.status === "saved") {
          setSave({ kind: "saved", delta: res.delta, where: "server" });
        } else if (res.status === "anonymous") {
          // Not logged in: run the same reducer locally and persist to localStorage.
          const graded = gradePlay(record, POKEMON);
          if (!graded) return setSave({ kind: "none", reason: "unknown-challenge" });
          const { progress, delta } = applyPlayResult(readLocalProgress(), graded.outcome);
          writeLocalProgress(progress);
          setSave({ kind: "saved", delta, where: "local" });
        } else {
          setSave({ kind: "none", reason: res.status });
        }
      })
      .catch(() => setSave({ kind: "none", reason: "error" }));
  }, [challenge, seed, results]);

  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center bg-slate-950 px-6 py-10 text-center text-slate-100">
      <div className="flex w-full max-w-md flex-col items-center gap-8">
        <h1 className="text-3xl font-bold">게임 종료</h1>

        <div className="flex flex-col gap-2">
          <p className="text-6xl font-black text-indigo-400">
            {correct}
            <span className="text-2xl text-slate-500"> / {total}</span>
          </p>
          <p className="flex items-center justify-center gap-1 text-slate-400">
            정답률 {pct}% · 최고 콤보
            <Flame className="h-4 w-4 text-amber-400" />
            {maxCombo}
          </p>
        </div>

        <SaveBanner save={save} />

        <div className="flex w-full flex-col gap-3">
          <button
            type="button"
            onClick={() => challenge && start(challenge, POKEMON, randomSeed())}
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

function SaveBanner({ save }: { save: SaveState }) {
  if (save.kind === "saving") {
    return <p className="text-sm text-slate-500">진행 저장 중…</p>;
  }
  if (save.kind === "none") {
    const msg = save.reason === "replay" ? "이미 기록된 게임이에요" : "진행을 저장하지 못했어요";
    return <p className="text-sm text-slate-500">{msg}</p>;
  }
  const { delta, where } = save;
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-slate-800 bg-slate-900/60 px-6 py-4">
      <p className="text-2xl font-bold text-emerald-400">+{delta.xpGained} XP</p>
      {delta.leveledUp && (
        <p className="flex items-center gap-1.5 text-lg font-semibold text-amber-400">
          <Sparkles className="h-5 w-5" />
          레벨 {delta.levelAfter} 달성!
        </p>
      )}
      <p className="flex items-center gap-1.5 text-xs text-slate-500">
        {where === "server" ? (
          <>
            <Cloud className="h-3.5 w-3.5" />
            계정에 저장됨
          </>
        ) : (
          <>
            <HardDrive className="h-3.5 w-3.5" />이 브라우저에 저장됨 (로그인하면 계정에 저장)
          </>
        )}
      </p>
    </div>
  );
}
