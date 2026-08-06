import "server-only";
import { and, eq } from "drizzle-orm";
import { newlyEarnedBadges } from "@/domain/badge/judgeBadges";
import type { ClearStatus } from "@/domain/challenge/clear";
import { gradePlay } from "@/domain/challenge/gradePlay";
import { applyPlayResult, EMPTY_PROGRESS } from "@/domain/progress/applyPlayResult";
import {
  applyPlayToRecord,
  type ChallengeRecord,
  EMPTY_RECORD,
  type RecordDelta,
} from "@/domain/progress/challengeRecord";
import { resolveLevel } from "@/domain/progress/level";
import type { Progress, ProgressDelta } from "@/domain/progress/types";
import type { PlayRecord } from "@/shared/play";
import { POKEMON } from "../data/pokemon";
import { db } from "../db";
import {
  challengeRecords,
  earnedBadges as earnedBadgesTable,
  playResults,
  progress as progressTable,
} from "../db/schema";

export type SubmitResult =
  | {
      status: "saved";
      delta: ProgressDelta;
      clear: ClearStatus;
      record: RecordDelta;
      /** Badge ids unlocked by THIS play — the end-of-game celebration. */
      newBadges: string[];
    }
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

  // Runs only after the play row was inserted, so a replay can never inflate a
  // best score or a play count.
  const recordDelta = await updateChallengeRecord(userId, graded.challengeId, {
    score: delta.score,
    status: graded.status,
  });

  const newBadges = await awardBadges(userId, next);

  return { status: "saved", delta, clear: graded.status, record: recordDelta, newBadges };
}

/**
 * Re-judge the whole badge catalog against the player's freshly written state
 * and persist anything new.
 *
 * Reads the records back from the table rather than patching the one just
 * written, so the judge always sees exactly what is stored. Badges are only ever
 * INSERTED — `onConflictDoNothing` on the (user, badge) key means a badge that
 * somehow re-qualifies is not re-dated, and one already held is never revoked.
 */
async function awardBadges(userId: string, progress: Progress): Promise<string[]> {
  const [records, held] = await Promise.all([
    db.select().from(challengeRecords).where(eq(challengeRecords.userId, userId)),
    db.select().from(earnedBadgesTable).where(eq(earnedBadgesTable.userId, userId)),
  ]);

  const state = {
    progress,
    records: Object.fromEntries(
      records.map((r) => [
        r.challengeId,
        { bestScore: r.bestScore, cleared: r.cleared, perfect: r.perfect, playCount: r.playCount },
      ]),
    ),
  };

  const fresh = newlyEarnedBadges(state, held.map((b) => b.badgeId));
  if (fresh.length === 0) return [];

  await db
    .insert(earnedBadgesTable)
    .values(fresh.map((badgeId) => ({ userId, badgeId })))
    .onConflictDoNothing();

  return fresh;
}

/** Read-modify-write of one challenge's standing (same tx caveat as progress). */
async function updateChallengeRecord(
  userId: string,
  challengeId: string,
  play: { score: number; status: ClearStatus },
): Promise<RecordDelta> {
  const [row] = await db
    .select()
    .from(challengeRecords)
    .where(
      and(eq(challengeRecords.userId, userId), eq(challengeRecords.challengeId, challengeId)),
    );

  const current: ChallengeRecord = row
    ? {
        bestScore: row.bestScore,
        cleared: row.cleared,
        perfect: row.perfect,
        playCount: row.playCount,
      }
    : EMPTY_RECORD;

  const { record, delta } = applyPlayToRecord(current, play);

  await db
    .insert(challengeRecords)
    .values({
      userId,
      challengeId,
      ...record,
      clearedAt: delta.firstClear ? new Date() : null,
    })
    .onConflictDoUpdate({
      target: [challengeRecords.userId, challengeRecords.challengeId],
      set: {
        ...record,
        // Only ever set on the first clear — never overwrite the original date.
        ...(delta.firstClear ? { clearedAt: new Date() } : {}),
        updatedAt: new Date(),
      },
    });

  return delta;
}
