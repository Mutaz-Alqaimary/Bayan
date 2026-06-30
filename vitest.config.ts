import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * Vitest configuration (Phase 16 — Testing). Development tooling only; entirely
 * separate from the Next 16 / Turbopack build (`next build`, `next dev`,
 * `next start` are unaffected). See `docs/phases/16-testing.md` and
 * `docs/Testing.md`.
 *
 * - Default environment is `node` (Unit, Offline-Integration, Localization).
 *   Component/RTL files opt into jsdom with a `// @vitest-environment jsdom`
 *   docblock — no deprecated `environmentMatchGlobs`.
 * - `@` resolves to the project root, mirroring `tsconfig` `"@/*": ["./*"]`.
 * - `server-only` / `client-only` are aliased to an empty stub (their default
 *   export throws under Vitest); required for the analytics/identity pure modules.
 * - The required public Supabase env vars are provided with throwaway values so
 *   modules importing `lib/supabase/env.ts` (validated at import time) load — this
 *   is runtime configuration, not a behavior mock; no real service is contacted.
 */
const rootDir = fileURLToPath(new URL("./", import.meta.url));
const emptyStub = fileURLToPath(new URL("./test/stubs/empty.ts", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^@\/(.*)$/, replacement: `${rootDir}$1` },
      { find: /^server-only$/, replacement: emptyStub },
      { find: /^client-only$/, replacement: emptyStub },
    ],
  },
  test: {
    environment: "node",
    setupFiles: ["./test/setup.ts"],
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
    },
  },
});
