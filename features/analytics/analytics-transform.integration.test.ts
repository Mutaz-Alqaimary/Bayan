import { describe, expect, it } from "vitest";

import {
  bucketAverages,
  bucketCounts,
  computeTrendIndicator,
  toTrendSeries,
  type TrendRow,
} from "@/features/analytics/aggregate";
import { parseAnalyticsSearchParams } from "@/features/analytics/search-params";
import {
  resolveAnalyticsWindow,
  resolveBucketGranularity,
  resolveComparisonWindow,
  type AnalyticsWindow,
} from "@/features/analytics/time-range";
import { average } from "@/features/dashboard/data/shared";
import { sessionRow, type SessionRowFixture } from "@/test/fixtures";

/**
 * Offline integration: the analytics transform pipeline that
 * `getCohortReadingAnalytics` composes *after* its DB read — URL params →
 * window/granularity → bucketed trend series → KPI indicator. Pure modules,
 * fixture rows, fixed `now`, no Supabase. Owns the *composition wiring*; the
 * per-function edge cases live in the unit tests (no overlap).
 */
const NOW = new Date("2026-06-30T12:00:00.000Z");
const label = (d: Date) => d.toISOString();

function inWindow(row: SessionRowFixture, window: AnalyticsWindow): boolean {
  const at = new Date(row.completed_at).getTime();
  if (window.start && at < window.start.getTime()) return false;
  return at <= window.end.getTime();
}

const rows: SessionRowFixture[] = [
  // current 30d window (2026-05-31 → 2026-06-30)
  sessionRow({ completed_at: "2026-06-10T10:00:00.000Z", words_per_minute: 100 }),
  sessionRow({ completed_at: "2026-06-20T10:00:00.000Z", words_per_minute: 120 }),
  // comparison window (2026-05-01 → 2026-05-31)
  sessionRow({ completed_at: "2026-05-10T10:00:00.000Z", words_per_minute: 80 }),
  sessionRow({ completed_at: "2026-05-20T10:00:00.000Z", words_per_minute: 100 }),
];

describe("analytics transform pipeline (search-params → window → buckets → KPI)", () => {
  it("resolves the range from URL params and feeds the window math", () => {
    const { range } = parseAnalyticsSearchParams({ range: "30d" });
    const window = resolveAnalyticsWindow(range, NOW);
    const comparison = resolveComparisonWindow(range, NOW);
    const granularity = resolveBucketGranularity(range);

    const current = rows.filter((r) => inWindow(r, window));
    const previous = comparison ? rows.filter((r) => inWindow(r, comparison)) : [];

    expect(current).toHaveLength(2);
    expect(previous).toHaveLength(2);

    // KPI: current avg WPM (110) vs comparison avg WPM (90) → up.
    const kpi = computeTrendIndicator(
      average(current.map((r) => r.words_per_minute!)),
      comparison ? average(previous.map((r) => r.words_per_minute!)) : null,
    );
    expect(kpi).toMatchObject({ current: 110, previous: 90, delta: 20, direction: "up", comparable: true });

    // WPM trend series: in-range values bucketed by day, gaps left null.
    const trendRows: TrendRow[] = current.map((r) => ({
      at: r.completed_at,
      value: r.words_per_minute,
    }));
    const series = toTrendSeries(
      bucketAverages(trendRows, window.start, window.end, granularity, label),
    );
    expect(series.points.filter((p) => p.value !== null).map((p) => p.value)).toEqual([100, 120]);
    expect(series.points.some((p) => p.value === null)).toBe(true);
    expect(series.summary).toMatchObject({ current: 120, highest: 120, lowest: 100 });

    // Activity volume: counts per bucket, empty buckets are a measured 0.
    const activity = bucketCounts(
      current.map((r) => ({ at: r.completed_at })),
      window.start,
      window.end,
      granularity,
      label,
    );
    expect(activity.reduce((sum, p) => sum + (p.value ?? 0), 0)).toBe(2);
  });

  it("has no comparison delta for the `all` range (comparable=false)", () => {
    const { range } = parseAnalyticsSearchParams({ range: "all" });
    const comparison = resolveComparisonWindow(range, NOW);
    expect(comparison).toBeNull();

    const kpi = computeTrendIndicator(
      average(rows.map((r) => r.words_per_minute!)),
      comparison ? 0 : null,
    );
    expect(kpi.comparable).toBe(false);
    expect(kpi.previous).toBeNull();
  });

  it("buckets the quarter range by week", () => {
    const { range } = parseAnalyticsSearchParams({ range: "3m" });
    expect(resolveBucketGranularity(range)).toBe("week");
  });
});
