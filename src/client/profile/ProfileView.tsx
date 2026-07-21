"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getMyProgressAction } from "@/app/profile/actions";
import type { Progress } from "@/domain/progress/types";
import { ProgressView } from "./ProgressView";

type State = { kind: "loading" } | { kind: "authed"; progress: Progress } | { kind: "anonymous" };

/** Profile dashboard — login-only. Anonymous visitors get a sign-in prompt. */
export function ProfileView() {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let active = true;
    getMyProgressAction()
      .then((res) => {
        if (!active) return;
        setState(res.status === "authed" ? { kind: "authed", progress: res.progress } : { kind: "anonymous" });
      })
      .catch(() => active && setState({ kind: "anonymous" }));
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="flex min-h-full flex-1 flex-col items-center bg-slate-950 px-6 py-12 text-slate-100">
      <div className="flex w-full max-w-lg flex-col gap-8">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tight">내 진행</h1>
          <div className="flex items-center gap-2 text-sm">
            <Link href="/play" className="rounded-full bg-indigo-500 px-4 py-2 font-semibold text-white hover:bg-indigo-400">
              플레이
            </Link>
            <Link href="/" className="rounded-full border border-slate-700 px-4 py-2 text-slate-300 hover:bg-slate-800">
              홈
            </Link>
          </div>
        </header>

        {state.kind === "loading" && <p className="text-sm text-slate-500">불러오는 중…</p>}
        {state.kind === "anonymous" && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 px-6 py-12 text-center">
            <p className="text-slate-300">로그인하면 진행이 계정에 저장되고 여기서 볼 수 있어요.</p>
            <Link
              href="/login"
              className="rounded-full bg-indigo-500 px-6 py-3 font-semibold text-white transition hover:bg-indigo-400"
            >
              로그인
            </Link>
          </div>
        )}
        {state.kind === "authed" && <ProgressView progress={state.progress} />}
      </div>
    </main>
  );
}
