import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center gap-10 bg-slate-950 px-6 text-center text-slate-100">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-5xl font-black tracking-tight">
          Poké<span className="text-indigo-400">Mastery</span>
        </h1>
        <p className="text-slate-400">실루엣만 보고 포켓몬 이름을 맞혀보세요 · 관동 151</p>
      </div>
      <Link
        href="/play"
        className="rounded-full bg-indigo-500 px-8 py-4 text-lg font-semibold text-white transition hover:bg-indigo-400 active:scale-[0.98]"
      >
        플레이 시작
      </Link>
    </main>
  );
}
