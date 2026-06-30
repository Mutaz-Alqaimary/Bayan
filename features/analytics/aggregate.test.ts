import { describe, expect, it } from "vitest";

import {
  bucketAverages,
  bucketCounts,
  computeTrendIndicator,
  summarizeTrend,
  toTrendSeries,
  type TrendRow,
} from "@/features/analytics/aggregate";

/**
 * Edge-case ownership for the pure analytics math: the comparison/null
 * semantics, the neutral deadband, and the empty-bucket `null`-vs-`0` rule.
 * The *composition* of these into a view model is covered by the analytics
 * offline-integration test (no overlap).
 */
const label = (date: Date) => date.toISOString();
const DAY = 86_400_000;

describe("computeTrendIndicator", () => {
  it("is not comparable when there is no previous value (null, never 0)", () => {
    const ind = computeTrendIndicator(100, null);
    expect(ind).toMatchObject({
      current: 100,
      previous: null,
      delta: null,
      deltaPercent: null,
      direction: "neutral",
      comparable: false,
    });
  });

  it("reports up / down for real changes", () => {
    expect(computeTrendIndicator(110, 100)).toMatchObject({
      delta: 10,
      deltaPercent: 10,
      direction: "up",
      comparable: true,
    });
    expect(computeTrendIndicator(90, 100)).toMatchObject({
      delta: -10,
      direction: "down",
    });
  });

  it("treats a change within the neutral deadband as neutral", () => {
    // 1% change < TREND_NEUTRAL_THRESHOLD (2%).
    expect(computeTrendIndicator(101, 100).direction).toBe("neutral");
    // Exactly equal → delta 0 → neutral.
    expect(computeTrendIndicator(100, 100).direction).toBe("neutral");
  });

  it("handles a zero previous (percent null, still directional)", () => {
    expect(computeTrendIndicator(5, 0)).toMatchObject({
      delta: 5,
      deltaPercent: null,
      direction: "up",
      comparable: true,
    });
  });
});

describe("summarizeTrend", () => {
  it("summarizes latest vs previous and high/low across the series", () => {
    const summary = summarizeTrend([
      { bucketId: "a", date: "", label: "", value: 10 },
      { bucketId: "b", date: "", label: "", value: 20 },
      { bucketId: "c", date: "", label: "", value: 15 },
    ]);
    expect(summary).toMatchObject({
      current: 15,
      previous: 20,
      change: -5,
      highest: 20,
      lowest: 10,
      direction: "down",
      sampleCount: 3,
      periodCount: 3,
    });
  });

  it("ignores null buckets in the value stats", () => {
    const summary = summarizeTrend([
      { bucketId: "a", date: "", label: "", value: null },
      { bucketId: "b", date: "", label: "", value: 30 },
    ]);
    expect(summary).toMatchObject({
      current: 30,
      previous: null,
      change: null,
      highest: 30,
      lowest: 30,
      sampleCount: 1,
      periodCount: 2,
    });
  });
});

describe("toTrendSeries", () => {
  it("wraps points with their derived summary", () => {
    const points = [{ bucketId: "a", date: "", label: "", value: 42 }];
    const series = toTrendSeries(points);
    expect(series.points).toBe(points);
    expect(series.summary.current).toBe(42);
  });
});

describe("bucketAverages vs bucketCounts (empty-bucket semantics)", () => {
  const start = new Date("2026-06-01T12:00:00.000Z");
  const end = new Date("2026-06-05T12:00:00.000Z");
  // Two sessions on the 2nd (avg 90), one on the 4th (60); the 1st/3rd/5th empty.
  const rows: TrendRow[] = [
    { at: "2026-06-02T09:00:00.000Z", value: 80 },
    { at: "2026-06-02T15:00:00.000Z", value: 100 },
    { at: "2026-06-04T10:00:00.000Z", value: 60 },
  ];

  it("averages values within a bucket and leaves gaps null (not 0)", () => {
    const points = bucketAverages(rows, start, end, "day", label);
    const values = points.filter((p) => p.value !== null).map((p) => p.value);
    expect(values).toEqual([90, 60]);
    expect(points.some((p) => p.value === null)).toBe(true);
  });

  it("counts rows per bucket and fills empty buckets with 0", () => {
    const points = bucketCounts(
      rows.map((r) => ({ at: r.at })),
      start,
      end,
      "day",
      label,
    );
    // Every row lands in exactly one in-range bucket.
    const total = points.reduce((sum, p) => sum + (p.value ?? 0), 0);
    expect(total).toBe(rows.length);
    expect(points.some((p) => p.value === 0)).toBe(true);
  });

  it("anchors on the earliest row when start is null (the `all` range)", () => {
    const points = bucketAverages(rows, null, end, "day", label);
    expect(points.length).toBeGreaterThan(0);
    expect(points[0].value).toBe(90); // first bucket = the 2nd, averaged
  });

  it("caps enumerated buckets so a huge range can't run unbounded", () => {
    const farStart = new Date(end.getTime() - 500 * DAY);
    const points = bucketCounts([], farStart, end, "day", label);
    expect(points.length).toBe(400); // MAX_BUCKETS
  });
});
