"use client";

import { useEffect, useState } from "react";
import { getMyRecordsAction } from "@/app/play/actions";
import { parseChallengeId } from "@/domain/challenge/catalog";
import type { ChallengeRecord } from "@/domain/progress/challengeRecord";
import { readLocalRecords } from "./localRecords";

export type RecordsByChallenge = Record<string, ChallengeRecord>;

/**
 * Best scores and clear flags for every challenge, from the account when signed
 * in and from localStorage otherwise. Starts empty so the server render and the
 * first client render agree; the real data arrives right after.
 */
export function useChallengeRecords(): RecordsByChallenge {
  const [records, setRecords] = useState<RecordsByChallenge>({});

  useEffect(() => {
    let alive = true;
    getMyRecordsAction()
      .then((res) => {
        if (!alive) return;
        setRecords(res.status === "authed" ? res.records : readLocalRecords());
      })
      // A failed lookup shouldn't blank the picker — fall back to whatever this
      // browser knows.
      .catch(() => alive && setRecords(readLocalRecords()));
    return () => {
      alive = false;
    };
  }, []);

  return records;
}

/** Has this mode been cleared on ANY pool and difficulty? */
export function modeCleared(records: RecordsByChallenge, modeId: string): boolean {
  return Object.entries(records).some(
    ([id, r]) => r.cleared && parseChallengeId(id)?.modeId === modeId,
  );
}
