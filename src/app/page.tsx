import Link from "next/link";
import { AuthStatus } from "@/client/auth/AuthStatus";
import { Pokeball } from "@/client/ui/Pokeball";

export default function Home() {
  return (
    <main className="relative flex min-h-[100dvh] flex-1 flex-col items-center justify-center gap-8 overflow-hidden bg-zinc-950 px-6 text-center text-zinc-100">
      {/* Poké Ball red glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 h-72 w-72 rounded-full bg-poke-500/20 blur-3xl"
      />

      <header className="absolute right-5 top-5 z-10">
        <AuthStatus />
      </header>

      <div className="relative flex flex-col items-center gap-6">
        <Pokeball className="h-24 w-24 drop-shadow-[0_10px_30px_rgba(238,26,36,0.35)]" />
        <div className="flex flex-col items-center gap-3">
          <h1 className="text-5xl font-black tracking-tight sm:text-6xl">
            Poké<span className="text-poke-500">Mastery</span>
          </h1>
          <p className="max-w-xs text-zinc-400">실루엣만 보고 포켓몬 이름을 맞혀보세요 · 관동 151</p>
        </div>
      </div>

      <Link
        href="/play"
        className="relative rounded-full bg-poke-500 px-10 py-4 text-lg font-bold text-white shadow-lg shadow-poke-500/30 transition hover:bg-poke-400 active:scale-[0.97]"
      >
        플레이 시작
      </Link>
    </main>
  );
}
