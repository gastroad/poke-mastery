"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/client/auth";

type Mode = "sign-in" | "sign-up";

/** Game-themed email/password auth form (sign-in ⇄ sign-up toggle). */
export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const isSignUp = mode === "sign-up";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    const result = isSignUp
      ? await authClient.signUp.email({ email, password, name: name.trim() || email })
      : await authClient.signIn.email({ email, password });
    setPending(false);

    if (result.error) {
      setError(result.error.message ?? "문제가 발생했어요. 다시 시도해주세요.");
      return;
    }
    router.push("/play");
    router.refresh();
  };

  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center bg-slate-950 px-6 py-10 text-slate-100">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="text-center">
          <h1 className="text-3xl font-black tracking-tight">
            Poké<span className="text-indigo-400">Mastery</span>
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {isSignUp ? "계정을 만들면 진행이 저장됩니다" : "로그인하고 진행을 이어가세요"}
          </p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          {isSignUp && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="닉네임 (선택)"
              autoComplete="nickname"
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-indigo-400"
            />
          )}
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일"
            autoComplete="email"
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-indigo-400"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-indigo-400"
          />

          {error && <p className="text-sm text-rose-400">{error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="mt-1 w-full rounded-xl bg-indigo-500 px-4 py-3 text-lg font-semibold text-white transition hover:bg-indigo-400 active:scale-[0.98] disabled:opacity-60"
          >
            {pending ? "처리 중…" : isSignUp ? "가입하기" : "로그인"}
          </button>
        </form>

        <div className="flex flex-col items-center gap-3 text-sm text-slate-400">
          <button
            type="button"
            onClick={() => {
              setMode(isSignUp ? "sign-in" : "sign-up");
              setError(null);
            }}
            className="text-slate-300 underline-offset-4 hover:underline"
          >
            {isSignUp ? "이미 계정이 있어요 · 로그인" : "계정이 없어요 · 회원가입"}
          </button>
          <Link href="/play" className="text-slate-500 hover:text-slate-300">
            로그인 없이 플레이 (진행은 이 브라우저에만 저장)
          </Link>
        </div>
      </div>
    </main>
  );
}
