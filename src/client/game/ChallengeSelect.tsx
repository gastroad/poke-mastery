"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getMyProgressAction } from "@/app/profile/actions";
import { AuthStatus } from "@/client/auth/AuthStatus";
import { CHALLENGES } from "@/domain/challenge/catalog";
import { describeUnlock, isUnlocked } from "@/domain/challenge/unlock";
import type { Progress } from "@/domain/progress/types";
import { readLocalProgress } from "./localProgress";

/** Challenge picker: unlocks are computed from progress (DB if logged in, else localStorage). */
export function ChallengeSelect() {
  const [progress, setProgress] = useState<Progress | null>(null);

  useEffect(() => {
    let active = true;
    getMyProgressAction()
      .then((res) => {
        if (!active) return;
        setProgress(res.status === "authed" ? res.progress : readLocalProgress());
      })
      .catch(() => active && setProgress(readLocalProgress()));
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="flex min-h-full flex-1 flex-col items-center bg-slate-950 px-6 py-12 text-slate-100">
      <div className="flex w-full max-w-lg flex-col gap-8">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tight">챌린지</h1>
          <AuthStatus />
        </header>

        {progress === null ? (
          <p className="text-sm text-slate-500">불러오는 중…</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {CHALLENGES.map((challenge) => {
              const unlocked = isUnlocked(challenge.unlock, progress);
              if (unlocked) {
                return (
                  <li key={challenge.id}>
                    <Link
                      href={`/play/${challenge.id}`}
                      className="flex items-center justify-between rounded-2xl border border-slate-700 bg-slate-900 px-5 py-4 transition hover:border-indigo-500 hover:bg-slate-800"
                    >
                      <div className="flex min-w-0 flex-col">
                        <span className="text-lg font-semibold">{challenge.title}</span>
                        <span className="truncate text-sm text-slate-400">{challenge.description}</span>
                      </div>
                      <span className="shrink-0 pl-3 text-sm font-medium text-indigo-400">플레이 →</span>
                    </Link>
                  </li>
                );
              }
              return (
                <li
                  key={challenge.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/40 px-5 py-4"
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="text-lg font-semibold text-slate-500">{challenge.title}</span>
                    <span className="truncate text-sm text-slate-600">{describeUnlock(challenge.unlock)}</span>
                  </div>
                  <Lock className="h-5 w-5 shrink-0 text-slate-600" />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
