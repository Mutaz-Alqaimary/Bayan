import "server-only";

import {
  average,
  isNumber,
  startOfWeek,
} from "@/features/dashboard/data/shared";
import type { BucketGranularity } from "@/features/analytics/time-range";
import type {
  AnalyticsTrendPoint,
  AnalyticsTrendSeries,
  ChartSummary,
  TrendDirection,
  TrendIndicator,
} from "@/features/analytics/types";

/**
 * Pure, shared trend math for Reading Analytics (Phase 13).
 *
 * The **single source of truth** for analytics aggregation: it *reuses* the
 * dashboard helpers (`average`, `isNumber`, `startOfWeek`) rather than forking
 * them (spec §8), and adds only the analytics-specific shapes (trend indicators,
 * chart summaries, time-bucketed series). Every function is deterministic — no
 * clock reads, no I/O, no mutation — so identical inputs always yield identical
 * outputs (spec §11) and they unit-test directly (Phase 16).
 */

/**
 * Upper bound on session rows pulled per analytics read. Bounded by design;
 * caching/pagination for large datasets is **Phase 14 (Performance)** scope.
 */
export const ANALYTICS_SESSION_LIMIT = 2000;

/** Safety cap on enumerated buckets (e.g. all-time monthly) — never unbounded. */
const MAX_BUCKETS = 400;

/**
 * Relative change (percent) below which a move is reported as `neutral` rather
 * than `up`/`down` — so a negligible wobble isn't dressed up as a real trend.
 * Exposed as a single named, adjustable knob (not buried in the calculation) so
 * the neutral band can be tuned without touching business logic.
 */
export const TREND_NEUTRAL_THRESHOLD = 2;

/** Direction of a change, with a deadband so tiny moves read as `neutral`. */
function resolveDirection(
  delta: number | null,
  deltaPercent: number | null,
): TrendDirection {
  if (delta === null || delta === 0) return "neutral";
  if (
    deltaPercent !== null &&
    Math.abs(deltaPercent) < TREND_NEUTRAL_THRESHOLD
  ) {
    return "neutral";
  }
  return delta > 0 ? "up" : "down";
}

/**
 * A KPI value plus its change vs. the comparison period. **Missing comparison
 * data stays `null`, never `0`** (refinement: Comparison Window): when there is
 * no prior measurement, `previous`/`delta`/`deltaPercent` are `null` and
 * `comparable` is `false`.
 */
export function computeTrendIndicator(
  current: number | null,
  previous: number | null,
): TrendIndicator {
  const comparable = current !== null && previous !== null;
  const delta = comparable ? current - previous : null;
  const deltaPercent =
    comparable && previous !== 0
      ? ((current - previous) / Math.abs(previous)) * 100
      : null;
  return {
    current,
    previous,
    delta,
    deltaPercent,
    direction: resolveDirection(delta, deltaPercent),
    comparable,
  };
}

/**
 * The at-a-glance figures shown beside a chart so it reads without hover
 * (spec §11a.2): latest vs. the preceding point, plus the high/low across the
 * series. Self-contained — derived purely from the series' own points.
 */
export function summarizeTrend(points: AnalyticsTrendPoint[]): ChartSummary {
  const values = points.map((point) => point.value).filter(isNumber);
  const current = values.length > 0 ? values[values.length - 1] : null;
  const previous = values.length > 1 ? values[values.length - 2] : null;
  const change = current !== null && previous !== null ? current - previous : null;
  const changePercent =
    current !== null && previous !== null && previous !== 0
      ? ((current - previous) / Math.abs(previous)) * 100
      : null;
  return {
    current,
    previous,
    change,
    changePercent,
    highest: values.length > 0 ? Math.max(...values) : null,
    lowest: values.length > 0 ? Math.min(...values) : null,
    direction: resolveDirection(change, changePercent),
    sampleCount: values.length,
    periodCount: points.length,
  };
}

/** Wrap points with their derived no-hover summary into a chart-ready series. */
export function toTrendSeries(points: AnalyticsTrendPoint[]): AnalyticsTrendSeries {
  return { points, summary: summarizeTrend(points) };
}

/** Start of the bucket a date falls in, for the given granularity. */
function bucketStartOf(date: Date, granularity: BucketGranularity): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  if (granularity === "month") {
    start.setDate(1);
    return start;
  }
  if (granularity === "week") {
    return startOfWeek(date); // Saturday-start — reuses the dashboard helper.
  }
  return start; // day
}

/** The next bucket's start after `start`, for the given granularity. */
function advance(start: Date, granularity: BucketGranularity): Date {
  const next = new Date(start);
  if (granularity === "day") next.setDate(next.getDate() + 1);
  else if (granularity === "week") next.setDate(next.getDate() + 7);
  else next.setMonth(next.getMonth() + 1);
  return next;
}

/** Stable, granularity-encoded id for a bucket start (e.g. `d:2026-06-29`). */
function bucketIdOf(start: Date, granularity: BucketGranularity): string {
  const year = start.getFullYear();
  const month = String(start.getMonth() + 1).padStart(2, "0");
  const day = String(start.getDate()).padStart(2, "0");
  if (granularity === "day") return `d:${year}-${month}-${day}`;
  if (granularity === "week") return `w:${year}-${month}-${day}`;
  return `m:${year}-${month}`;
}

type BucketDef = { bucketId: string; start: Date };

/** Every bucket from `start` to `end` inclusive (gaps included), capped. */
function enumerateBuckets(
  start: Date,
  end: Date,
  granularity: BucketGranularity,
): BucketDef[] {
  const defs: BucketDef[] = [];
  let cursor = bucketStartOf(start, granularity);
  while (cursor.getTime() <= end.getTime() && defs.length < MAX_BUCKETS) {
    defs.push({ bucketId: bucketIdOf(cursor, granularity), start: new Date(cursor) });
    cursor = advance(cursor, granularity);
  }
  return defs;
}

/** Earliest `at` among rows, or `null` when there are none. */
function earliestAt(rows: { at: string }[]): Date | null {
  let min: number | null = null;
  for (const row of rows) {
    const time = new Date(row.at).getTime();
    if (min === null || time < min) min = time;
  }
  return min === null ? null : new Date(min);
}

/** A row reduced to its timestamp + the metric value being trended. */
export type TrendRow = { at: string; value: number | null };

/**
 * Bucket rows into a trend series by **averaging** the metric per period. Empty
 * buckets are `value: null` ("no data"), never `0` — the chart shows a gap, not
 * a false zero. `start === null` (the `all` range) anchors on the earliest row.
 */
export function bucketAverages(
  rows: TrendRow[],
  start: Date | null,
  end: Date,
  granularity: BucketGranularity,
  formatLabel: (bucketStart: Date) => string,
): AnalyticsTrendPoint[] {
  const effectiveStart = start ?? earliestAt(rows) ?? end;
  const defs = enumerateBuckets(effectiveStart, end, granularity);

  const valuesByBucket = new Map<string, number[]>();
  for (const row of rows) {
    if (row.value === null) continue;
    const id = bucketIdOf(bucketStartOf(new Date(row.at), granularity), granularity);
    const bucket = valuesByBucket.get(id);
    if (bucket) bucket.push(row.value);
    else valuesByBucket.set(id, [row.value]);
  }

  return defs.map((def) => {
    const values = valuesByBucket.get(def.bucketId) ?? [];
    return {
      bucketId: def.bucketId,
      date: def.start.toISOString(),
      label: formatLabel(def.start),
      value: values.length > 0 ? average(values) : null,
    };
  });
}

/**
 * Bucket rows into a trend series by **counting** rows per period (e.g. sessions
 * per day). Empty buckets are `value: 0` — a measured zero, the right semantics
 * for activity volume (unlike averages, where empty means "no data").
 */
export function bucketCounts(
  rows: { at: string }[],
  start: Date | null,
  end: Date,
  granularity: BucketGranularity,
  formatLabel: (bucketStart: Date) => string,
): AnalyticsTrendPoint[] {
  const effectiveStart = start ?? earliestAt(rows) ?? end;
  const defs = enumerateBuckets(effectiveStart, end, granularity);

  const countByBucket = new Map<string, number>();
  for (const row of rows) {
    const id = bucketIdOf(bucketStartOf(new Date(row.at), granularity), granularity);
    countByBucket.set(id, (countByBucket.get(id) ?? 0) + 1);
  }

  return defs.map((def) => ({
    bucketId: def.bucketId,
    date: def.start.toISOString(),
    label: formatLabel(def.start),
    value: countByBucket.get(def.bucketId) ?? 0,
  }));
}
