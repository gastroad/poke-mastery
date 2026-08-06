import { notFound } from "next/navigation";
import { PlayScreen } from "@/client/game/PlayScreen";
import {
  challengeId,
  DEFAULT_POOL_ID,
  getChallenge,
  resolveDifficultyId,
} from "@/domain/challenge/catalog";

/** A repeated query param arrives as an array; take the first value. */
function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/**
 * The mode owns the path because it's what the player chose; the pool and the
 * difficulty are settings, so they ride in the query with defaults — which
 * makes a bare `/play/bingo` a valid, shareable link.
 */
export default async function PlayChallengePage({
  params,
  searchParams,
}: {
  params: Promise<{ modeId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { modeId } = await params;
  const query = await searchParams;

  // Resolved here rather than inside getChallenge, so the id handed to the
  // grader is always canonical (see `resolveDifficultyId`).
  const difficultyId = resolveDifficultyId(modeId, first(query.d));
  if (!difficultyId) notFound();

  const poolId = first(query.pool) ?? DEFAULT_POOL_ID;
  const challenge = getChallenge(challengeId(poolId, modeId, difficultyId));
  if (!challenge) notFound();

  return <PlayScreen challenge={{ id: challenge.id, rule: challenge.rule }} />;
}
