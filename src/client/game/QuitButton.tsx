"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useSessionStore } from "@/client/stores/sessionStore";

/**
 * "Leave this game" — the control every mode's header carries.
 *
 * Quitting ends the game rather than discarding it: the grader already scores
 * only what the player actually attempted (see `gradePlay`), so nine correct
 * answers still count when you walk away on the tenth. Losing them would be the
 * hostile reading of a button labelled 그만두기.
 *
 * Two shapes, depending on whether there is anything to keep:
 * - nothing played yet → leave straight away, no prompt to dismiss;
 * - mid-game → confirm, with the game frozen so deciding costs no clock.
 */
export function QuitButton() {
  const router = useRouter();
  const [asking, setAsking] = useState(false);

  const results = useSessionStore((s) => s.results);
  const placed = useSessionStore((s) => s.placed);
  const pause = useSessionStore((s) => s.pause);
  const resume = useSessionStore((s) => s.resume);
  const finishNow = useSessionStore((s) => s.finishNow);

  // Only one of these is ever non-zero: bingo fills cells, everything else
  // answers questions.
  const answered = results.length;
  const filled = placed.filter((id) => id !== null).length;
  const isBingo = placed.length > 0;
  const played = answered + filled;

  const dismiss = useCallback(() => {
    setAsking(false);
    resume();
  }, [resume]);

  useEffect(() => {
    if (!asking) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [asking, dismiss]);

  const onClick = () => {
    if (played === 0) {
      // Nothing has happened yet, so there is nothing to confirm losing.
      router.push("/play");
      return;
    }
    pause();
    setAsking(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        aria-label="게임 그만두기"
        className="-ml-1 shrink-0 rounded-full p-1.5 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"
      >
        <X className="h-5 w-5" />
      </button>

      {asking && (
        <>
          <button
            type="button"
            aria-label="닫기"
            onClick={dismiss}
            className="fixed inset-0 z-40 cursor-default bg-zinc-950/80"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="quit-title"
            className="fixed left-1/2 top-1/2 z-50 w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-center"
          >
            <h2 id="quit-title" className="text-lg font-bold text-zinc-100">
              게임을 그만둘까요?
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              {isBingo
                ? `지금까지 채운 ${filled}칸은 그대로 기록돼요.`
                : `지금까지 푼 ${answered}문제는 그대로 기록돼요.`}
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={dismiss}
                className="w-full rounded-xl bg-poke-500 px-4 py-3 font-semibold text-white transition hover:bg-poke-400 active:scale-[0.98]"
              >
                계속하기
              </button>
              <button
                type="button"
                onClick={finishNow}
                className="w-full rounded-xl border border-zinc-700 px-4 py-3 text-zinc-300 transition hover:bg-zinc-800"
              >
                그만두고 결과 보기
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
