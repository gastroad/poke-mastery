"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getMyProgressAction } from "@/app/profile/actions";
import { readLocalBadges } from "@/client/game/localBadges";
import { Pokeball } from "@/client/ui/Pokeball";
import type { Progress } from "@/domain/progress/types";
import { BadgeCase } from "./BadgeCase";
import { ProgressView } from "./ProgressView";

type State =
  | { kind: "loading" }
  | { kind: "authed"; progress: Progress; badges: string[] }
  | { kind: "anonymous"; badges: string[] };

/** Profile dashboard. Progress needs an account; the badge case works either
    way, reading localStorage for players who haven't signed in. */
export function ProfileView() {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let active = true;
    getMyProgressAction()
      .then((res) => {
        if (!active) return;
        setState(
          res.status === "authed"
            ? { kind: "authed", progress: res.progress, badges: res.badges }
            : { kind: "anonymous", badges: readLocalBadges() },
        );
      })
      .catch(() => active && setState({ kind: "anonymous", badges: readLocalBadges() }));
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="flex min-h-full flex-1 flex-col items-center bg-zinc-950 px-6 py-12 text-zinc-100">
      <div className="flex w-full max-w-lg flex-col gap-8">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tight">내 진행</h1>
          <div className="flex items-center gap-2 text-sm">
            <Link href="/play" className="rounded-full bg-poke-500 px-4 py-2 font-semibold text-white hover:bg-poke-400">
              플레이
            </Link>
            <Link href="/" className="rounded-full border border-zinc-700 px-4 py-2 text-zinc-300 hover:bg-zinc-800">
              홈
            </Link>
          </div>
        </header>

        {state.kind === "loading" && (
          <div className="flex justify-center py-12">
            <Pokeball className="h-10 w-10" spin />
          </div>
        )}
        {/* Anonymous players still earn badges (into localStorage), so the case
            has to be visible to them — a badge you can never look at isn't one.
            The sign-in prompt stays: those badges live in this browser only. */}
        {state.kind === "anonymous" && (
          <>
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 px-6 py-8 text-center">
              <p className="text-zinc-300">
                로그인하면 진행이 계정에 저장돼요. 지금 배지는 이 브라우저에만 있어요.
              </p>
              <Link
                href="/login"
                className="rounded-full bg-poke-500 px-6 py-3 font-semibold text-white transition hover:bg-poke-400"
              >
                로그인
              </Link>
            </div>
            <BadgeCase earned={state.badges} />
          </>
        )}
        {state.kind === "authed" && (
          <>
            <ProgressView progress={state.progress} />
            <BadgeCase earned={state.badges} />
          </>
        )}
      </div>
    </main>
  );
}
