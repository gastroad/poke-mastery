import { z } from "zod";

/**
 * The ONLY thing the client sends when a game ends. The server re-derives the
 * questions from `seed` and re-judges `attempts` — it never trusts a
 * client-reported score. Validated with Zod at the trust boundary.
 */
export const playRecordSchema = z.object({
  challengeId: z.string().min(1),
  seed: z.number().int().nonnegative(),
  /** Raw player inputs in question order (one per answered question). */
  attempts: z.array(z.string()).min(1).max(50),
});

export type PlayRecord = z.infer<typeof playRecordSchema>;
