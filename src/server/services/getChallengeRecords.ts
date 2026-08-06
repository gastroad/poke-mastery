import "server-only";
import { eq } from "drizzle-orm";
import type { ChallengeRecord } from "@/domain/progress/challengeRecord";
import { db } from "../db";
import { challengeRecords } from "../db/schema";

/** Every challenge this user has a standing on, keyed by challenge id. */
export async function getChallengeRecords(
  userId: string,
): Promise<Record<string, ChallengeRecord>> {
  const rows = await db
    .select()
    .from(challengeRecords)
    .where(eq(challengeRecords.userId, userId));

  return Object.fromEntries(
    rows.map((r) => [
      r.challengeId,
      { bestScore: r.bestScore, cleared: r.cleared, perfect: r.perfect, playCount: r.playCount },
    ]),
  );
}
