import "server-only";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { earnedBadges } from "../db/schema";

/** Badge ids this user holds. */
export async function getEarnedBadges(userId: string): Promise<string[]> {
  const rows = await db
    .select({ badgeId: earnedBadges.badgeId })
    .from(earnedBadges)
    .where(eq(earnedBadges.userId, userId));
  return rows.map((r) => r.badgeId);
}
