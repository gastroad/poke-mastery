import { EMPTY_PROGRESS } from "@/domain/progress/applyPlayResult";
import type { Progress } from "@/domain/progress/types";

/**
 * Anonymous progress lives in localStorage (persistence begins at login; no
 * guest→account merge). Same `Progress` shape the server stores, updated by the
 * same `applyPlayResult` reducer — the client just swaps the DB for localStorage.
 */
const KEY = "pokemastery:progress:v1";

export function readLocalProgress(): Progress {
  if (typeof window === "undefined") return EMPTY_PROGRESS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY_PROGRESS;
    const parsed = JSON.parse(raw) as Progress;
    if (typeof parsed?.totalXp !== "number" || typeof parsed?.typeStats !== "object") {
      return EMPTY_PROGRESS;
    }
    return parsed;
  } catch {
    return EMPTY_PROGRESS;
  }
}

export function writeLocalProgress(progress: Progress): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(progress));
  } catch {
    // ignore quota / serialization errors — progress is best-effort for anonymous play
  }
}
