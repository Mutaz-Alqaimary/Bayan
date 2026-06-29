/**
 * Time-range windowing for Reading Analytics (Phase 13).
 *
 * Pure and deterministic — every function takes `now` **explicitly** and reads
 * no clock, so identical inputs always produce identical windows (the
 * determinism requirement, spec §11/§6). Shared by the analytics data layer (to
 * filter + bucket sessions) and the UI (to label ranges). No I/O, no side
 * effects, no mutation of inputs.
 */

/** The selectable analytics ranges (spec §6). */
export const TIME_RANGES = ["7d", "30d", "3m", "all"] as const;

/** A selectable analytics time range. */
export type TimeRange = (typeof TIME_RANGES)[number];

/** Range applied when none is selected or an invalid value is supplied. */
export const DEFAULT_TIME_RANGE: TimeRange = "30d";

/** Runtime guard for an untrusted range value (e.g. a URL search param). */
export function isTimeRange(value: unknown): value is TimeRange {
  return (
    typeof value === "string" &&
    (TIME_RANGES as readonly string[]).includes(value)
  );
}

/**
 * A half-open analytics window `[start, end)`. `start === null` means "no lower
 * bound" (the `all` range); `end` is always the reference instant (`now`).
 */
export type AnalyticsWindow = {
  start: Date | null;
  end: Date;
};

/** Bucketing granularity for a range's trend series. */
export type BucketGranularity = "day" | "week" | "month";

/** `from` minus `n` days (pure; never mutates the input). */
function subtractDays(from: Date, n: number): Date {
  const date = new Date(from);
  date.setDate(date.getDate() - n);
  return date;
}

/** `from` minus `n` calendar months (pure; never mutates the input). */
function subtractMonths(from: Date, n: number): Date {
  const date = new Date(from);
  date.setMonth(date.getMonth() - n);
  return date;
}

/**
 * The window currently selected for analytics. `all` has no lower bound; the
 * bounded ranges go back from `now` by their length.
 */
export function resolveAnalyticsWindow(
  range: TimeRange,
  now: Date,
): AnalyticsWindow {
  switch (range) {
    case "7d":
      return { start: subtractDays(now, 7), end: now };
    case "30d":
      return { start: subtractDays(now, 30), end: now };
    case "3m":
      return { start: subtractMonths(now, 3), end: now };
    case "all":
      return { start: null, end: now };
  }
}

/**
 * The immediately-preceding equal-length window, used to compute KPI/chart
 * trend deltas (spec §11a.1). `all` has no comparison period → `null`, so the UI
 * renders values without a misleading change.
 */
export function resolveComparisonWindow(
  range: TimeRange,
  now: Date,
): AnalyticsWindow | null {
  switch (range) {
    case "7d":
      return { start: subtractDays(now, 14), end: subtractDays(now, 7) };
    case "30d":
      return { start: subtractDays(now, 60), end: subtractDays(now, 30) };
    case "3m":
      return { start: subtractMonths(now, 6), end: subtractMonths(now, 3) };
    case "all":
      return null;
  }
}

/**
 * The trend-series bucket granularity for a range — short ranges bucket by day,
 * a quarter by week, all-time by month — so a chart shows a readable number of
 * points regardless of range.
 */
export function resolveBucketGranularity(range: TimeRange): BucketGranularity {
  switch (range) {
    case "7d":
    case "30d":
      return "day";
    case "3m":
      return "week";
    case "all":
      return "month";
  }
}
