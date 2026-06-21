/**
 * Central, locale-agnostic route paths (no locale prefix — that is added by the
 * next-intl navigation helpers). Avoids hardcoded route strings scattered
 * through the app, per `.claude/rules/architecture.md`.
 *
 * Pages for these routes are built in their respective phases (auth: Phase 5,
 * dashboard: Phase 6); the constants exist now so the Phase 2 route guards can
 * reference them without hardcoding.
 */
export const ROUTES = {
  home: "/",
  login: "/login",
  dashboard: "/dashboard",
} as const;
