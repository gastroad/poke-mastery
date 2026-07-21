import { notFound } from "next/navigation";
import { PlayScreen } from "@/client/game/PlayScreen";
import { getChallenge } from "@/domain/challenge/catalog";

export default async function PlayChallengePage({ params }: { params: Promise<{ challengeId: string }> }) {
  const { challengeId } = await params;
  const challenge = getChallenge(challengeId);
  if (!challenge) notFound();

  return <PlayScreen challenge={{ id: challenge.id, rule: challenge.rule }} />;
}
