import "server-only";
import { eq } from "drizzle-orm";
import { EMPTY_PROGRESS } from "@/domain/progress/applyPlayResult";
import type { Progress } from "@/domain/progress/types";
import { db } from "../db";
import { progress as progressTable } from "../db/schema";

/** Load a user's materialized progress (or empty if they have never played). */
export async function getProgress(userId: string): Promise<Progress> {
  const [row] = await db.select().from(progressTable).where(eq(progressTable.userId, userId));
  return row ? { totalXp: row.totalXp, typeStats: row.typeStats } : EMPTY_PROGRESS;
}
