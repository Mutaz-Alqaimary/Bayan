import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site-url";
import { ROUTES } from "@/lib/routes";

/**
 * `robots.txt` (Phase 19). Allows the public marketing + auth surfaces and
 * disallows the authenticated app sections (the `(app)` route group) and the
 * auth API. Paths are locale-prefixed at runtime (`/ar/...`, `/en/...`), so each
 * disallow uses a `/*` wildcard to cover both locales. References the generated
 * sitemap and points crawlers at the canonical host.
 */

// The authenticated sections that require a session — every route in the
// `(app)` group. Kept in sync with `ROUTES` rather than hardcoded strings.
const AUTHENTICATED_PATHS = [
  ROUTES.dashboard,
  ROUTES.students,
  ROUTES.teachers,
  ROUTES.passages,
  ROUTES.vocabulary,
  ROUTES.readingSessions,
  ROUTES.analytics,
  ROUTES.reports,
  ROUTES.settings,
] as const;

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", ...AUTHENTICATED_PATHS.map((path) => `/*${path}`)],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
