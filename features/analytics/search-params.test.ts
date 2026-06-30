import { describe, expect, it } from "vitest";

import { DEFAULT_TIME_RANGE } from "@/features/analytics/time-range";
import {
  ANALYTICS_RANGE_PARAM,
  ANALYTICS_STUDENT_PARAM,
  parseAnalyticsSearchParams,
} from "@/features/analytics/search-params";

/**
 * The analytics URL-param contract: a valid range passes through, anything else
 * falls back to the default, and a missing/blank student means the cohort view.
 */
describe("parseAnalyticsSearchParams", () => {
  it("passes a valid range and student through", () => {
    expect(
      parseAnalyticsSearchParams({
        [ANALYTICS_RANGE_PARAM]: "7d",
        [ANALYTICS_STUDENT_PARAM]: "student-42",
      }),
    ).toEqual({ range: "7d", studentId: "student-42" });
  });

  it("falls back to the default range for an invalid or missing value", () => {
    expect(parseAnalyticsSearchParams({}).range).toBe(DEFAULT_TIME_RANGE);
    expect(
      parseAnalyticsSearchParams({ [ANALYTICS_RANGE_PARAM]: "90d" }).range,
    ).toBe(DEFAULT_TIME_RANGE);
  });

  it("treats a missing or blank student as the cohort view (null)", () => {
    expect(parseAnalyticsSearchParams({}).studentId).toBeNull();
    expect(
      parseAnalyticsSearchParams({ [ANALYTICS_STUDENT_PARAM]: "   " }).studentId,
    ).toBeNull();
  });

  it("takes the first value of a repeated param", () => {
    expect(
      parseAnalyticsSearchParams({
        [ANALYTICS_RANGE_PARAM]: ["3m", "7d"],
        [ANALYTICS_STUDENT_PARAM]: ["s1", "s2"],
      }),
    ).toEqual({ range: "3m", studentId: "s1" });
  });
});
