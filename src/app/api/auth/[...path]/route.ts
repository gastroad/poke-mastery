import { auth } from "@/server/auth";

// Proxies auth requests from the client SDK to the Neon Auth server.
export const { GET, POST } = auth.handler();
