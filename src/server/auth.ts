import "server-only";
import { createNeonAuth } from "@neondatabase/auth/next/server";

if (!process.env.NEON_AUTH_BASE_URL) {
  throw new Error("NEON_AUTH_BASE_URL is not set. Add it to .env.local (the console 'Auth URL').");
}
if (!process.env.NEON_AUTH_COOKIE_SECRET) {
  throw new Error("NEON_AUTH_COOKIE_SECRET is not set. Generate with `openssl rand -base64 32`.");
}

/**
 * Server-side Neon Auth (Better Auth) singleton. Provides `getSession`,
 * `signIn`/`signUp`/`signOut`, and `.handler()` for the API route. Used only in
 * server actions, route handlers, and dynamically-rendered server components.
 */
export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL,
  cookies: { secret: process.env.NEON_AUTH_COOKIE_SECRET },
});
