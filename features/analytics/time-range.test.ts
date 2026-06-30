import { describe, expect, it } from "vitest";

import {
  DEFAULT_TIME_RANGE,
  isTimeRange,
  resolveAnalyticsWindow,
  resolveBucketGranularity,
  resolveComparisonWindow,
} from "@/features/analytics/time-range";

/**
 * Pure, deterministic windowing — `now` is always explicit, so identical inputs
 * yield identical windows (the analytics determinism invariant, spec §11).
 */
const NOW = new Date("2026-06-30T12:00:00.000Z");

describe("isTimeRange", () => {
  it("accepts the known ranges and rejects anything else", () => {
    expect(isTimeRange("7d")).toBe(true);
    expect(isTimeRange("30d")).toBe(true);
    expect(isTimeRange("3m")).toBe(true);
    expect(isTimeRange("all")).toBe(true);
    expect(isTimeRange("90d")).toBe(false);
    expect(isTimeRange(undefined)).toBe(false);
    expect(isTimeRange(7)).toBe(false);
  });
});

describe("resolveAnalyticsWindow", () => {
  it("anchors `end` at `now` and goes back by the range length", () => {
    expect(resolveAnalyticsWindow("7d", NOW)).toEqual({
      start: new Date("2026-06-23T12:00:00.000Z"),
      end: NOW,
    });
    expect(resolveAnalyticsWindow("30d", NOW)).toEqual({
      start: new Date("2026-05-31T12:00:00.000Z"),
      end: NOW,
    });
    expect(resolveAnalyticsWindow("3m", NOW)).toEqual({
      start: new Date("2026-03-30T12:00:00.000Z"),
      end: NOW,
    });
  });

  it("has no lower bound for `all`", () => {
    expect(resolveAnalyticsWindow("all", NOW)).toEqual({ start: null, end: NOW });
  });

  it("does not mutate the passed `now`", () => {
    const now = new Date(NOW);
    resolveAnalyticsWindow("30d", now);
    expect(now.getTime()).toBe(NOW.getTime());
  });
});

describe("resolveComparisonWindow", () => {
  it("returns the immediately-preceding equal-length window", () => {
    expect(resolveComparisonWindow("7d", NOW)).toEqual({
      start: new Date("2026-06-16T12:00:00.000Z"),
      end: new Date("2026-06-23T12:00:00.000Z"),
    });
    expect(resolveComparisonWindow("30d", NOW)).toEqual({
      start: new Date("2026-05-01T12:00:00.000Z"),
      end: new Date("2026-05-31T12:00:00.000Z"),
    });
  });

  it("has no comparison period for `all` (null, not a misleading delta)", () => {
    expect(resolveComparisonWindow("all", NOW)).toBeNull();
  });
});

describe("resolveBucketGranularity", () => {
  it("buckets short ranges by day, a quarter by week, all-time by month", () => {
    expect(resolveBucketGranularity("7d")).toBe("day");
    expect(resolveBucketGranularity("30d")).toBe("day");
    expect(resolveBucketGranularity("3m")).toBe("week");
    expect(resolveBucketGranularity("all")).toBe("month");
  });
});

describe("DEFAULT_TIME_RANGE", () => {
  it("is a valid range", () => {
    expect(isTimeRange(DEFAULT_TIME_RANGE)).toBe(true);
  });
});
