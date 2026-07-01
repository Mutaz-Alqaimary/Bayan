import { describe, expect, it } from "vitest";

import { buildReportMeta } from "./report-meta";

/**
 * Unit tests for the pure report-composition core (Phase 18). These protect the
 * document invariants that distinguish a report from raw analytics: a normalized
 * byline and a passed-through (never clock-read) `generatedAt`.
 */

describe("buildReportMeta", () => {
  it("passes generatedAt and range through unchanged (deterministic, no clock read)", () => {
    const meta = buildReportMeta({
      range: "30d",
      generatedAt: "2026-07-01T09:00:00.000Z",
      generatedByName: "Sara Ahmad",
    });
    expect(meta).toEqual({
      range: "30d",
      generatedAt: "2026-07-01T09:00:00.000Z",
      generatedByName: "Sara Ahmad",
    });
  });

  it("normalizes a whitespace-only or missing name to null", () => {
    expect(
      buildReportMeta({ range: "7d", generatedAt: "x", generatedByName: "   " })
        .generatedByName,
    ).toBeNull();
    expect(
      buildReportMeta({ range: "7d", generatedAt: "x", generatedByName: null })
        .generatedByName,
    ).toBeNull();
    expect(
      buildReportMeta({
        range: "7d",
        generatedAt: "x",
        generatedByName: undefined,
      }).generatedByName,
    ).toBeNull();
  });

  it("trims surrounding whitespace from a real name", () => {
    expect(
      buildReportMeta({
        range: "all",
        generatedAt: "x",
        generatedByName: "  Mr. Khaled  ",
      }).generatedByName,
    ).toBe("Mr. Khaled");
  });
});
