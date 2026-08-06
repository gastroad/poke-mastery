import {
  boolean,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
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

/**
 * Per-challenge standing: best score, and whether it has ever been cleared or
 * perfected. A materialized cache of `applyPlayToRecord` over the play log —
 * the same trade `progress` already makes. Deriving it from `play_results` with
 * a GROUP BY would re-judge every historical row against today's clear bars,
 * so a tuned threshold would silently rewrite the past.
 *
 * `cleared`/`perfect` are sticky: they record that you once did it, so a later
 * bad run can never take a badge away.
 */
export const challengeRecords = pgTable(
  "challenge_records",
  {
    userId: text("user_id").notNull(),
    challengeId: text("challenge_id").notNull(),
    bestScore: integer("best_score").notNull().default(0),
    cleared: boolean("cleared").notNull().default(false),
    perfect: boolean("perfect").notNull().default(false),
    playCount: integer("play_count").notNull().default(0),
    /** When the challenge was first cleared; null until then. */
    clearedAt: timestamp("cleared_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.challengeId] })],
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
export type ChallengeRecordRow = typeof challengeRecords.$inferSelect;
export type EarnedBadgeRow = typeof earnedBadges.$inferSelect;
