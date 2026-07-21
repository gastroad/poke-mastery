import { notFound } from "next/navigation";
import { PlayScreen } from "@/client/game/PlayScreen";
import { challengeId, getChallenge } from "@/domain/challenge/catalog";

export default async function PlayChallengePage({
  params,
}: {
  params: Promise<{ poolId: string; modeId: string }>;
}) {
  const { poolId, modeId } = await params;
  const challenge = getChallenge(challengeId(poolId, modeId));
  if (!challenge) notFound();

  return <PlayScreen challenge={{ id: challenge.id, rule: challenge.rule }} />;
}
