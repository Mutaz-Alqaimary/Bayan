/**
 * Locale-aware formatting helpers.
 *
 * Per the Phase 6 decision, Bayan uses **Western Arabic numerals (0–9)**
 * everywhere, including the Arabic UI, for scanability and consistency with
 * embedded Latin terms. This is enforced by appending the `-u-nu-latn` Unicode
 * extension to the locale, which forces the `latn` numbering system regardless
 * of the locale's default (Arabic's default is otherwise Eastern Arabic-Indic).
 *
 * Framework-agnostic (plain `Intl`), so these work in Server Components, Server
 * Actions, and Client Components alike. Pass the active locale from
 * `getLocale()` / `useLocale()`.
 */

function latnLocale(locale: string): string {
  return `${locale}-u-nu-latn`;
}

/** A whole number (e.g. counts, WPM). */
export function formatNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(latnLocale(locale), {
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * A percentage from a 0–100 value (the shape `accuracy_percentage` is stored
 * in), e.g. `93.5` → `"94%"`. Rounded to a whole percent for dashboard display.
 */
export function formatPercent(value: number, locale: string): string {
  return new Intl.NumberFormat(latnLocale(locale), {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(value / 100);
}

/** A decimal with one fractional digit (e.g. averages). */
export function formatDecimal(value: number, locale: string): string {
  return new Intl.NumberFormat(latnLocale(locale), {
    maximumFractionDigits: 1,
  }).format(value);
}

/** A reading duration in seconds as compact `m:ss` (Western numerals, LTR). */
export function formatDuration(totalSeconds: number, locale: string): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${formatNumber(minutes, locale)}:${String(seconds).padStart(2, "0")}`;
}

/** A medium-style date (e.g. activity timestamps). */
export function formatDate(value: string | Date, locale: string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat(latnLocale(locale), {
    dateStyle: "medium",
  }).format(date);
}
