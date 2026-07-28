"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthStatus } from "@/client/auth/AuthStatus";
import { PokeballBackdrop } from "@/client/ui/PokeballBackdrop";

/** When to navigate during the curtain-open — slightly before it finishes, so
    the challenge list fades in as the halves are still clearing. */
const EXIT_MS = 470;

/**
 * The landing hero. A full-screen Poké Ball assembles behind the content on
 * mount, then the wordmark and button rise in over it. Pressing "플레이 시작"
 * opens the ball vertically (curtain) and routes to /play, where the challenge
 * list rises in. Reduced-motion users skip straight to the destination.
 */
export function HomeHero() {
  const router = useRouter();
  const [exiting, setExiting] = useState(false);

  function handleStart(e: React.MouseEvent<HTMLAnchorElement>) {
    // Let the browser handle modified clicks (open in new tab, etc.).
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    if (exiting) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      router.push("/play");
      return;
    }

    setExiting(true);
    window.setTimeout(() => router.push("/play"), EXIT_MS);
  }

  return (
    <main
      className={`relative flex min-h-[100dvh] flex-1 flex-col items-center justify-center overflow-hidden bg-zinc-950 px-6 text-center text-zinc-100 ${
        exiting ? "is-exiting" : ""
      }`}
    >
      <PokeballBackdrop />

      <header className="absolute right-5 top-5 z-20">
        <AuthStatus />
      </header>

      <div className="relative z-10 flex flex-col items-center gap-5">
        {/* Soft dark plate so the wordmark/button sit on a clean field, not the
            busy center button behind them. */}
        <div
          aria-hidden
          className="hero-plate pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[150%] w-[160%] -translate-x-1/2 -translate-y-1/2"
        />
        <h1 className="hero-title text-6xl font-black tracking-tight drop-shadow-[0_2px_24px_rgba(0,0,0,0.65)] sm:text-7xl">
          Poké<span className="text-poke-500">Mastery</span>
        </h1>
        <p className="hero-tagline max-w-xs text-zinc-300 drop-shadow-[0_1px_12px_rgba(0,0,0,0.7)]">
          실루엣만 보고 포켓몬 이름을 맞혀보세요 · 관동 151
        </p>
        <Link
          href="/play"
          onClick={handleStart}
          className="hero-cta mt-3 rounded-full bg-poke-500 px-10 py-4 text-lg font-bold text-white shadow-lg shadow-poke-500/40 transition hover:bg-poke-400 active:scale-[0.97]"
        >
          플레이 시작
        </Link>
      </div>
    </main>
  );
}
