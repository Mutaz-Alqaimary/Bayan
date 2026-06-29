import {
  DEFAULT_TIME_RANGE,
  isTimeRange,
  type TimeRange,
} from "@/features/analytics/time-range";

/**
 * The single contract for the analytics URL search params (Phase 13).
 *
 * Analytics state — the selected `range` and drilled-in `student` — lives in the
 * URL (server-resolved, no hidden client state; spec §6/§11). Parsing and the
 * param **names** are centralized here so the route, the range tabs, the
 * student-card links, and any future param all read/write one contract instead
 * of duplicating string keys and fallback logic. Pure and deterministic.
 */

/** URL key for the selected time range. */
export const ANALYTICS_RANGE_PARAM = "range";
/** URL key for the drilled-in student (`students.id`); absent = cohort view. */
export const ANALYTICS_STUDENT_PARAM = "student";

/** The resolved analytics route state. */
export type AnalyticsSearchParams = {
  range: TimeRange;
  /** `students.id` when drilled into a student, else `null` (cohort overview). */
  studentId: string | null;
};

/** Next.js may hand a param as a string, a repeated array, or `undefined`. */
type RawSearchParams = Record<string, string | string[] | undefined>;

/** First value of a possibly-repeated search param. */
function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Resolve the analytics route state from raw search params, applying the default
 * range and treating a missing/blank student as the cohort view. An invalid
 * `range` falls back to `DEFAULT_TIME_RANGE` rather than erroring.
 */
export function parseAnalyticsSearchParams(
  searchParams: RawSearchParams,
): AnalyticsSearchParams {
  const rawRange = firstValue(searchParams[ANALYTICS_RANGE_PARAM]);
  const range = isTimeRange(rawRange) ? rawRange : DEFAULT_TIME_RANGE;

  const rawStudent = firstValue(searchParams[ANALYTICS_STUDENT_PARAM])?.trim();
  const studentId = rawStudent ? rawStudent : null;

  return { range, studentId };
}
