import type { ReadingInsight } from "@/features/analytics/reading/types";

/**
 * Pre-format an insight's numeric interpolation values with the supplied
 * formatter. Numbers are formatted **before** they reach next-intl so they keep
 * Western Arabic numerals under `ar` (next-intl would otherwise localize a raw
 * number to Eastern Arabic-Indic). String values pass through untouched.
 *
 * Shared by the analytics per-student view (Phase 13) and the student report
 * (Phase 18) so the numeral-formatting rule lives in exactly one place; each call
 * site still passes the resulting map to its own inline `t(\`insights.kinds.…\`)`
 * so the template-literal message key stays type-checked by next-intl.
 */
export function formatInsightValues(
  insight: ReadingInsight,
  formatNumber: (value: number) => string,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(insight.values).map(([key, value]) => [
      key,
      typeof value === "number" ? formatNumber(value) : value,
    ]),
  );
}
