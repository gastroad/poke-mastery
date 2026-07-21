import { Lock } from "lucide-react";
import { CHALLENGES } from "@/domain/challenge/catalog";
import { describeUnlock, isUnlocked } from "@/domain/challenge/unlock";
import { resolveLevel } from "@/domain/progress/level";
import { masteryPct } from "@/domain/progress/mastery";
import type { Progress, TypeStat } from "@/domain/progress/types";
import type { PokemonType } from "@/domain/pokemon/types";
import { TYPE_NAME_KO } from "@/domain/pokemon/typeNames";

/** Presentational progress dashboard: level/XP, per-type mastery, challenge unlocks. */
export function ProgressView({ progress }: { progress: Progress }) {
  const { level, xpIntoLevel, xpForNext } = resolveLevel(progress.totalXp);
  const levelPct = xpForNext > 0 ? Math.round((xpIntoLevel / xpForNext) * 100) : 0;

  const masteries = Object.entries(progress.typeStats)
    .filter((e): e is [PokemonType, TypeStat] => !!e[1] && e[1].seen > 0)
    .sort((a, b) => b[1].seen - a[1].seen);

  return (
    <div className="flex w-full flex-col gap-8">
      <section className="flex flex-col gap-2">
        <div className="flex items-end justify-between">
          <span className="text-2xl font-black">Lv. {level}</span>
          <span className="text-sm text-slate-400">
            {xpIntoLevel} / {xpForNext} XP
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800">
          <div className="h-full rounded-full bg-indigo-500" style={{ width: `${levelPct}%` }} />
        </div>
        <span className="text-xs text-slate-500">누적 {progress.totalXp} XP</span>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-slate-300">타입 마스터리</h2>
        {masteries.length === 0 ? (
          <p className="text-sm text-slate-500">아직 기록이 없어요. 한 판 플레이해보세요!</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {masteries.map(([type, stat]) => {
              const pct = masteryPct(stat);
              return (
                <li key={type} className="flex items-center gap-3">
                  <span className="w-14 shrink-0 text-sm text-slate-300">{TYPE_NAME_KO[type]}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-24 shrink-0 text-right text-xs text-slate-500">
                    {pct}% ({stat.correct}/{stat.seen})
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-slate-300">챌린지</h2>
        <ul className="flex flex-col gap-2">
          {CHALLENGES.map((challenge) => {
            const unlocked = isUnlocked(challenge.unlock, progress);
            return (
              <li
                key={challenge.id}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                  unlocked ? "border-slate-700 bg-slate-900" : "border-slate-800 bg-slate-900/40"
                }`}
              >
                <div className="flex min-w-0 flex-col">
                  <span className={unlocked ? "font-semibold" : "font-semibold text-slate-500"}>
                    {challenge.title}
                  </span>
                  <span className="truncate text-xs text-slate-500">
                    {unlocked ? challenge.description : describeUnlock(challenge.unlock)}
                  </span>
                </div>
                {unlocked ? (
                  <span className="shrink-0 text-xs font-medium text-emerald-400">열림</span>
                ) : (
                  <Lock className="h-4 w-4 shrink-0 text-slate-600" />
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
