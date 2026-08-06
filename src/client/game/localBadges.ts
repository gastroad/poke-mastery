/**
 * Badges earned while signed out. Mirrors the `earned_badges` table, judged by
 * the same pure functions the server uses — so an anonymous player's badges
 * mean exactly what a logged-in player's do.
 */
const KEY = "pokemastery:badges:v1";

export function readLocalBadges(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

/** Adds ids to the held set. Badges are never removed. */
export function addLocalBadges(ids: readonly string[]): void {
  if (typeof window === "undefined" || ids.length === 0) return;
  try {
    const next = [...new Set([...readLocalBadges(), ...ids])];
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // ignore quota / serialization errors — anonymous badges are best-effort
  }
}
