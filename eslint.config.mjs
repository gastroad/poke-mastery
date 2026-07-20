import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // ── Layer boundary enforcement (see CLAUDE.md "Dependency rules") ──
  // domain/ must stay PURE: no framework, no client/server, no node/browser modules.
  {
    files: ["src/domain/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "react",
                "react-dom",
                "next",
                "next/**",
                "zustand",
                "@/client/**",
                "@/server/**",
                "@/app/**",
                "node:**",
                "fs",
                "path",
              ],
              message:
                "domain/ must be pure: no React/Next/Zustand/client/server/node imports. Keep game rules framework-free.",
            },
          ],
        },
      ],
    },
  },

  // client/ must not import server implementation (use shared/ types or an API call).
  {
    files: ["src/client/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/server/**"],
              message:
                "client/ must not import server implementation. Cross the boundary via shared/ types or a fetch/route call.",
            },
          ],
        },
      ],
    },
  },

  // server/ must not import client implementation.
  {
    files: ["src/server/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/client/**"],
              message: "server/ must not import client implementation.",
            },
          ],
        },
      ],
    },
  },

  // Override default ignores of eslint-config-next.
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
