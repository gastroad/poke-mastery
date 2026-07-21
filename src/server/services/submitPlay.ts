import "server-only";
import { eq } from "drizzle-orm";
import { gradePlay } from "@/domain/challenge/gradePlay";
import { applyPlayResult, EMPTY_PROGRESS } from "@/domain/progress/applyPlayResult";
import { resolveLevel } from "@/domain/progress/level";
import type { Progress, ProgressDelta } from "@/domain/progress/types";
import type { PlayRecord } from "@/shared/play";
import { POKEMON } from "../data/pokemon";
import { db } from "../db";
import { playResults, progress as progressTable } from "../db/schema";

export type SubmitResult =
  | { status: "saved"; delta: ProgressDelta }
  | { status: "replay" } // same (user, challenge, seed) already recorded — ignored
  | { status: "unknown-challenge" };

/**
 * Authoritative game submission. Re-grades from the seed (never trusts the
 * client), records the play (unique index blocks replays), and materialises the
 * new progress. Returns the delta for the client's celebration.
 *
 * NOTE: read-modify-write on progress (neon-http has no interactive tx); fine
 * for single-player, last-write-wins under rare concurrent submits.
 */
export async function submitPlay(userId: string, record: PlayRecord): Promise<SubmitResult> {
  const graded = gradePlay(record, POKEMON);
  if (!graded) return { status: "unknown-challenge" };

  const [row] = await db.select().from(progressTable).where(eq(progressTable.userId, userId));
  const current: Progress = row ? { totalXp: row.totalXp, typeStats: row.typeStats } : EMPTY_PROGRESS;

  const { progress: next, delta } = applyPlayResult(current, graded.outcome);

  // Anti-replay: the unique(user, challenge, seed) index makes a duplicate a no-op.
  const inserted = await db
    .insert(playResults)
    .values({
      userId,
      challengeId: graded.challengeId,
      seed: record.seed,
      score: delta.score,
      xpGained: delta.xpGained,
      correctCount: graded.correctCount,
      questionCount: graded.questionCount,
      attempts: record.attempts,
    })
    .onConflictDoNothing()
    .returning({ id: playResults.id });

  if (inserted.length === 0) return { status: "replay" };

  const level = resolveLevel(next.totalXp).level;
  await db
    .insert(progressTable)
    .values({ userId, totalXp: next.totalXp, level, typeStats: next.typeStats })
    .onConflictDoUpdate({
      target: progressTable.userId,
      set: { totalXp: next.totalXp, level, typeStats: next.typeStats, updatedAt: new Date() },
    });

  return { status: "saved", delta };
}
