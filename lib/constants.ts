/**
 * Central, framework-agnostic app constants — the single source of truth for
 * the app name, supported locales, and browser-storage keys. Other modules
 * (e.g. `i18n/routing.ts`, `lib/theme.ts`) import from here rather than
 * redefining these values.
 *
 * Note: user-facing names are localized via next-intl (`brand.name` in the
 * message catalogs). `APP_NAME` here is the non-localized, technical identifier
 * used for storage namespacing and as a metadata fallback.
 */

export const APP_NAME = "Bayan";

/** Supported locales. Arabic is first and is the default experience. */
export const LOCALES = ["ar", "en"] as const;
export type AppLocale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "ar";

/**
 * Native endonym for each locale (the language's name in its own script).
 * Used by the language switcher so each option is shown in its own language —
 * the standard, recognizable pattern. Because the label is therefore in a
 * script that may differ from the surrounding page, render it with a matching
 * `lang` attribute for correct screen-reader pronunciation.
 */
export const LOCALE_LABELS: Record<AppLocale, string> = {
  ar: "العربية",
  en: "English",
};

/**
 * Keys used for client-side persistence (localStorage). Namespaced with the
 * app name to avoid collisions on shared origins.
 */
export const STORAGE_KEYS = {
  theme: "bayan-theme",
} as const;
