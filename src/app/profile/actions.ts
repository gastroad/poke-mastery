"use server";
import type { Progress } from "@/domain/progress/types";
import { auth } from "@/server/auth";
import { getEarnedBadges } from "@/server/services/getEarnedBadges";
import { getProgress } from "@/server/services/getProgress";

export type MyProgressResponse =
  | { status: "authed"; progress: Progress; badges: string[] }
  | { status: "anonymous" };

/** Fetch the signed-in user's progress; "anonymous" tells the client to read localStorage. */
export async function getMyProgressAction(): Promise<MyProgressResponse> {
  const { data: session } = await auth.getSession();
  if (!session?.user) return { status: "anonymous" };
  const [progress, badges] = await Promise.all([
    getProgress(session.user.id),
    getEarnedBadges(session.user.id),
  ]);
  return { status: "authed", progress, badges };
}
