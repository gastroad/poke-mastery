import type { ChallengeRecord } from "@/domain/progress/challengeRecord";

/**
 * Anonymous per-challenge records, mirroring the `challenge_records` table for
 * players who haven't logged in. Same shape, same reducer (`applyPlayToRecord`)
 * — the client just swaps the DB for localStorage, exactly as `localProgress`
 * does for `progress`.
 */
const KEY = "pokemastery:records:v1";

export type LocalRecords = Record<string, ChallengeRecord>;

function isRecord(value: unknown): value is ChallengeRecord {
  const r = value as ChallengeRecord;
  return (
    typeof r?.bestScore === "number" &&
    typeof r?.cleared === "boolean" &&
    typeof r?.perfect === "boolean" &&
    typeof r?.playCount === "number"
  );
}

export function readLocalRecords(): LocalRecords {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null) return {};
    // Drop anything that doesn't look like a record rather than trusting the
    // whole blob — this is user-editable storage.
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).filter(([, v]) => isRecord(v)),
    ) as LocalRecords;
  } catch {
    return {};
  }
}

export function writeLocalRecord(challengeId: string, record: ChallengeRecord): void {
  if (typeof window === "undefined") return;
  try {
    const all = readLocalRecords();
    all[challengeId] = record;
    window.localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // ignore quota / serialization errors — anonymous records are best-effort
  }
}
