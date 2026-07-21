"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/client/auth";

/** Header widget: shows the signed-in user + sign-out, or a login link. */
export function AuthStatus() {
  const router = useRouter();
  const { data, isPending } = authClient.useSession();

  if (isPending) return <div className="h-9 w-20" aria-hidden />;

  if (!data?.user) {
    return (
      <Link
        href="/login"
        className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-800"
      >
        로그인
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="max-w-[10rem] truncate text-sm text-slate-300">
        {data.user.name || data.user.email}
      </span>
      <button
        type="button"
        onClick={async () => {
          await authClient.signOut();
          router.refresh();
        }}
        className="rounded-full border border-slate-700 px-3 py-2 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
      >
        로그아웃
      </button>
    </div>
  );
}
