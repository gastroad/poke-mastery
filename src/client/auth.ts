"use client";
import { createAuthClient } from "@neondatabase/auth/next";

/**
 * Browser auth client. Talks to our /api/auth/[...path] proxy (same origin).
 * Exposes signIn/signUp/signOut and the useSession hook for React components.
 */
export const authClient = createAuthClient();
