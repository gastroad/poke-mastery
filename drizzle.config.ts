import { defineConfig } from "drizzle-kit";

// drizzle-kit runs outside Next, so load .env.local ourselves (Node ≥20.12 native).
process.loadEnvFile(".env.local");

export default defineConfig({
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
