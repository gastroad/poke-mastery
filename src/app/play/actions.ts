"use server";
import type { ChallengeRecord } from "@/domain/progress/challengeRecord";
import { auth } from "@/server/auth";
import { getChallengeRecords } from "@/server/services/getChallengeRecords";
import { submitPlay, type SubmitResult } from "@/server/services/submitPlay";
import { playRecordSchema } from "@/shared/play";

export type SubmitPlayResponse =
  | SubmitResult
  | { status: "invalid" } // payload failed Zod validation
  | { status: "anonymous" }; // not logged in — client keeps progress in localStorage

/**
 * The trust boundary: validate the client's PlayRecord, resolve the logged-in
 * user from the session, and hand off to the authoritative submitPlay service.
 * Anonymous players get "anonymous" and save locally instead.
 */
export async function submitPlayAction(record: unknown): Promise<SubmitPlayResponse> {
  const parsed = playRecordSchema.safeParse(record);
  if (!parsed.success) return { status: "invalid" };

  const { data: session } = await auth.getSession();
  if (!session?.user) return { status: "anonymous" };

  return submitPlay(session.user.id, parsed.data);
}

export type MyRecordsResponse =
  | { status: "authed"; records: Record<string, ChallengeRecord> }
  | { status: "anonymous" }; // client reads localStorage instead

/** Best scores and clear flags for the picker. */
export async function getMyRecordsAction(): Promise<MyRecordsResponse> {
  const { data: session } = await auth.getSession();
  if (!session?.user) return { status: "anonymous" };
  return { status: "authed", records: await getChallengeRecords(session.user.id) };
}
