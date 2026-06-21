import { defineRouting } from "next-intl/routing";

import { DEFAULT_LOCALE, LOCALES, type AppLocale } from "@/lib/constants";

/**
 * Locale routing config. Locales and the default come from `lib/constants.ts`
 * (the single source of truth).
 *
 * Arabic is the primary, default experience (see `.claude/rules/arabic-rtl-i18n.md`),
 * so `ar` is the `defaultLocale`. `localePrefix: "always"` keeps every URL explicitly
 * scoped (`/ar/...`, `/en/...`), which avoids ambiguous root URLs and makes the active
 * locale obvious in links, analytics, and shared URLs.
 */
export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: "always",
});

export type { AppLocale };

/** Text direction for a given locale. Arabic is RTL; everything else is LTR. */
export function getLocaleDirection(locale: AppLocale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}
