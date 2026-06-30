/**
 * Empty stub aliased in place of `server-only` / `client-only` for the test
 * runner (see `vitest.config.ts`). Those packages' default export *throws* under
 * Vitest's Node resolution, but several pure, server-safe modules in scope import
 * them (e.g. `features/analytics/aggregate.ts`). Aliasing them to this no-op lets
 * the pure modules load in the Node test environment. Importing this changes no
 * product behavior — it only neutralizes the build-time import guard during tests.
 */
export {};
