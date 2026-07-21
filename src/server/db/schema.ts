import { integer, jsonb, pgTable, primaryKey, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
// Relative (not @/) so drizzle-kit's bundler needs no path-alias config.
// Type-only import — erased at build, never pulls domain code into migrations.
import type { Progress } from "../../domain/progress/types";

/**
 * DB holds USER DATA ONLY (Pokémon reference data lives in src/data JSON).
 * `userId` is the auth provider's user id (text) — no FK to the auth schema.
 */

/** Materialized per-user progress: one row per user, a cache of the reducer's output. */
export const progress = pgTable("progress", {
  userId: text("user_id").primaryKey(),
  totalXp: integer("total_xp").notNull().default(0),
  level: integer("level").notNull().default(1),
  typeStats: jsonb("type_stats").$type<Progress["typeStats"]>().notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Append-only log of finished games. The unique(user, challenge, seed) index is
 * the anti-replay guard: the same game can be persisted only once, so replaying
 * a seed cannot farm XP.
 */
export const playResults = pgTable(
  "play_results",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    challengeId: text("challenge_id").notNull(),
    seed: integer("seed").notNull(),
    score: integer("score").notNull(),
    xpGained: integer("xp_gained").notNull(),
    correctCount: integer("correct_count").notNull(),
    questionCount: integer("question_count").notNull(),
    /** Raw player inputs in order — lets the server re-derive/audit the game from the seed. */
    attempts: jsonb("attempts").$type<string[]>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("play_results_user_challenge_seed_uniq").on(t.userId, t.challengeId, t.seed)],
);

/** Earned badges: one row per (user, badge). */
export const earnedBadges = pgTable(
  "earned_badges",
  {
    userId: text("user_id").notNull(),
    badgeId: text("badge_id").notNull(),
    earnedAt: timestamp("earned_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.badgeId] })],
);

export type ProgressRow = typeof progress.$inferSelect;
export type NewPlayResult = typeof playResults.$inferInsert;
export type EarnedBadgeRow = typeof earnedBadges.$inferSelect;
