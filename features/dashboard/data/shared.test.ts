import { describe, expect, it } from "vitest";

import { startOfWeek } from "@/features/dashboard/data/shared";

/**
 * `startOfWeek` encodes the non-obvious Saturday-start convention for Arabic
 * locales (the analytics weekly buckets depend on it). It operates in local time,
 * so the fixtures are built with the local `Date` constructor — making the
 * boundary cases deterministic regardless of the runner's timezone. The other
 * shared helpers (`average`/`toNum`/`isNumber`) are exercised by the analytics
 * integration pipeline rather than duplicated here.
 *
 * In June 2026 the Saturdays are the 6th, 13th, 20th, 27th; the 28th is Sunday,
 * the 30th is Tuesday.
 */
describe("startOfWeek (Saturday-start)", () => {
  it("returns the same day at midnight when `now` is a Saturday", () => {
    const result = startOfWeek(new Date(2026, 5, 27, 15, 30, 45));
    expect(result.getDay()).toBe(6); // Saturday
    expect(result.getDate()).toBe(27);
    expect([result.getHours(), result.getMinutes(), result.getSeconds()]).toEqual([0, 0, 0]);
  });

  it("rolls back to the most recent Saturday mid-week", () => {
    // Tuesday the 30th → previous Saturday is the 27th.
    const result = startOfWeek(new Date(2026, 5, 30, 12, 0, 0));
    expect(result.getDate()).toBe(27);
    expect(result.getDay()).toBe(6);
  });

  it("rolls Sunday back to the prior Saturday", () => {
    // Sunday the 28th → week start is the 27th.
    const result = startOfWeek(new Date(2026, 5, 28, 8, 0, 0));
    expect(result.getDate()).toBe(27);
    expect(result.getDay()).toBe(6);
  });

  it("does not mutate the passed date", () => {
    const now = new Date(2026, 5, 30, 12, 0, 0);
    const before = now.getTime();
    startOfWeek(now);
    expect(now.getTime()).toBe(before);
  });
});
