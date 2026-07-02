import type { MetadataRoute } from "next";

import { DEFAULT_LOCALE, LOCALES } from "@/lib/constants";
import { ROUTES } from "@/lib/routes";
import { getSiteUrl } from "@/lib/site-url";

/**
 * `sitemap.xml` (Phase 19). Lists only the public, indexable pages — never the
 * authenticated `(app)` sections. Each entry is emitted once under the default
 * locale (`ar`) with per-locale `alternates.languages` so `/ar` and `/en`
 * cross-reference each other (hreflang), the recommended Next.js localized
 * sitemap shape. All URLs are absolute, built from `NEXT_PUBLIC_SITE_URL`.
 */

// Public routes only. `reset-password` is intentionally excluded — it is only
// reachable with a one-time recovery token, not a standalone indexable page.
const PUBLIC_PATHS = [
  ROUTES.home,
  ROUTES.login,
  ROUTES.register,
  ROUTES.forgotPassword,
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const lastModified = new Date();

  const localizedUrl = (locale: string, path: string) =>
    `${siteUrl}/${locale}${path === ROUTES.home ? "" : path}`;

  return PUBLIC_PATHS.map((path) => ({
    url: localizedUrl(DEFAULT_LOCALE, path),
    lastModified,
    alternates: {
      languages: Object.fromEntries(
        LOCALES.map((locale) => [locale, localizedUrl(locale, path)]),
      ),
    },
  }));
}
