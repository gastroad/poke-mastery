"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getMyProgressAction } from "@/app/profile/actions";
import { authClient } from "@/client/auth";
import { Pokeball } from "@/client/ui/Pokeball";
import { type LevelInfo, resolveLevel } from "@/domain/progress/level";

/** Google-style account chip: avatar → popover with a quick level/XP peek + links. */
export function AuthStatus() {
  const router = useRouter();
  const { data, isPending } = authClient.useSession();
  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState<LevelInfo | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const user = data?.user;

  // Lightweight progress peek for the popover (only when signed in).
  useEffect(() => {
    if (!user) return;
    let active = true;
    getMyProgressAction()
      .then((res) => {
        if (active && res.status === "authed") setLevel(resolveLevel(res.progress.totalXp));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [user]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (isPending) return <Pokeball className="h-8 w-8 opacity-60" spin />;

  if (!user) {
    return (
      <Link
        href="/login"
        className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition hover:bg-zinc-800"
      >
        로그인
      </Link>
    );
  }

  const label = user.name || user.email || "?";
  const initial = label.trim().charAt(0).toUpperCase();
  const levelPct = level && level.xpForNext > 0 ? (level.xpIntoLevel / level.xpForNext) * 100 : 0;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="계정 메뉴"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-poke-500 text-sm font-bold text-white transition hover:bg-poke-400"
      >
        {initial}
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-2 w-64 rounded-2xl border border-zinc-700 bg-zinc-900 p-4 text-left shadow-xl">
          <div className="flex items-center gap-3 border-b border-zinc-800 pb-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-poke-500 text-base font-bold text-white">
              {initial}
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold text-zinc-100">{user.name || "트레이너"}</span>
              <span className="truncate text-xs text-zinc-400">{user.email}</span>
            </div>
          </div>

          {level && (
            <div className="flex flex-col gap-1.5 py-3">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-zinc-200">Lv. {level.level}</span>
                <span className="text-zinc-400">
                  {level.xpIntoLevel} / {level.xpForNext} XP
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                <div className="h-full rounded-full bg-poke-500" style={{ width: `${levelPct}%` }} />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1 pt-2">
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm text-zinc-200 transition hover:bg-zinc-800"
            >
              프로필
            </Link>
            <button
              type="button"
              onClick={async () => {
                await authClient.signOut();
                setOpen(false);
                router.refresh();
              }}
              className="rounded-lg px-3 py-2 text-left text-sm text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
            >
              로그아웃
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
