"use server";
import type { Progress } from "@/domain/progress/types";
import { auth } from "@/server/auth";
import { getProgress } from "@/server/services/getProgress";

export type MyProgressResponse =
  | { status: "authed"; progress: Progress }
  | { status: "anonymous" };

/** Fetch the signed-in user's progress; "anonymous" tells the client to read localStorage. */
export async function getMyProgressAction(): Promise<MyProgressResponse> {
  const { data: session } = await auth.getSession();
  if (!session?.user) return { status: "anonymous" };
  return { status: "authed", progress: await getProgress(session.user.id) };
}
