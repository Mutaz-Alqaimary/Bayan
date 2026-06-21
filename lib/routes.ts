/**
 * Central, locale-agnostic route paths (no locale prefix — that is added by the
 * next-intl navigation helpers). Avoids hardcoded route strings scattered
 * through the app, per `.claude/rules/architecture.md`.
 *
 * Pages for these routes are built in their respective phases (auth: Phase 5,
 * dashboard: Phase 6); the constants exist now so the Phase 2 route guards can
 * reference them without hardcoding.
 *
 * `authCallback` is deliberately locale-agnostic and lives under `/api` so the
 * next-intl proxy (which prefixes every page route with a locale) leaves it
 * alone — it is a backend endpoint, not a localized page. See
 * `app/api/auth/callback/route.ts`.
 */
export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  dashboard: "/dashboard",
  authCallback: "/api/auth/callback",
} as const;
