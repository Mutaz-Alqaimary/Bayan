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

  // Destinations for sections built in later phases. The constants exist now so
  // navigation and quick actions reference them without hardcoding, but those
  // pages don't exist yet — nav/quick-action items mark them as not-yet-built
  // and render a disabled "coming soon" state instead of linking to a 404.
  // (students: Phase 7, passages/vocabulary: Phase 8, sessions: Phase 10,
  // analytics: Phase 13, reports: Phase 18, settings: Phase 12,
  // teachers: Phase 12.6.)
  students: "/students",
  teachers: "/teachers",
  passages: "/passages",
  vocabulary: "/vocabulary",
  readingSessions: "/reading-sessions",
  analytics: "/analytics",
  reports: "/reports",
  settings: "/settings",
} as const;

/** A locale-agnostic route path value from `ROUTES`. */
export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];

/**
 * Routes whose pages actually exist today. Anything not listed is "coming soon"
 * — navigation and quick-action items use this to disable links to unbuilt
 * destinations rather than send users to a 404. Add a route here in the phase
 * that builds its page.
 */
export const IMPLEMENTED_ROUTES: ReadonlySet<AppRoute> = new Set([
  ROUTES.home,
  ROUTES.login,
  ROUTES.register,
  ROUTES.forgotPassword,
  ROUTES.resetPassword,
  ROUTES.dashboard,
  ROUTES.students,
  ROUTES.teachers,
  ROUTES.passages,
  ROUTES.vocabulary,
  ROUTES.readingSessions,
  ROUTES.settings,
]);

/** Whether a route's page exists yet (vs. a planned, not-yet-built phase). */
export function isRouteImplemented(route: AppRoute): boolean {
  return IMPLEMENTED_ROUTES.has(route);
}
