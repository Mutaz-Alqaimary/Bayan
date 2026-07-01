/**
 * Pure report composition (Phase 18).
 *
 * The deterministic core of reporting: it assembles report metadata and derives
 * document-level flags from an analytics view model **without** any I/O, clock
 * read, or aggregation. Every input (including `generatedAt`) is passed in, so
 * identical inputs always yield identical output and these functions unit-test
 * directly (Phase 16 conventions). No raw session data is touched here — that is
 * already resolved by the reused Phase 13 layer.
 */

import type { TimeRange } from "@/features/analytics/time-range";

import type { ReportMeta } from "./types";

/** Trim a display name to `null` when it's missing or whitespace-only. */
function normalizeName(name: string | null | undefined): string | null {
  if (name == null) return null;
  const trimmed = name.trim();
  return trimmed === "" ? null : trimmed;
}

/**
 * Assemble the document metadata for a report. `generatedByName` is normalized
 * so a blank name renders as "no attribution" rather than an empty byline.
 */
export function buildReportMeta(params: {
  range: TimeRange;
  generatedAt: string;
  generatedByName: string | null | undefined;
}): ReportMeta {
  return {
    range: params.range,
    generatedAt: params.generatedAt,
    generatedByName: normalizeName(params.generatedByName),
  };
}
