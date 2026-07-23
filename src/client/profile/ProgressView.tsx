import { resolveLevel } from "@/domain/progress/level";
import { masteryPct } from "@/domain/progress/mastery";
import type { Progress, TypeStat } from "@/domain/progress/types";
import type { PokemonType } from "@/domain/pokemon/types";
import { TYPE_NAME_KO } from "@/domain/pokemon/typeNames";

/** Presentational progress dashboard: level/XP and per-type mastery. */
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
          <span className="text-sm text-zinc-400">
            {xpIntoLevel} / {xpForNext} XP
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-800">
          <div className="h-full rounded-full bg-poke-500" style={{ width: `${levelPct}%` }} />
        </div>
        <span className="text-xs text-zinc-500">누적 {progress.totalXp} XP</span>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-zinc-300">타입 마스터리</h2>
        {masteries.length === 0 ? (
          <p className="text-sm text-zinc-500">아직 기록이 없어요. 한 판 플레이해보세요!</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {masteries.map(([type, stat]) => {
              const pct = masteryPct(stat);
              return (
                <li key={type} className="flex items-center gap-3">
                  <span className="w-14 shrink-0 text-sm text-zinc-300">{TYPE_NAME_KO[type]}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-24 shrink-0 text-right text-xs text-zinc-500">
                    {pct}% ({stat.correct}/{stat.seen})
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
