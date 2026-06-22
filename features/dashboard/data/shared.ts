import "server-only";

import { passageTitle } from "@/features/reading/types";
import { studentDisplayName } from "@/features/students/types";
import type { RecentSessionView } from "@/features/dashboard/types";

/**
 * Shared helpers for the dashboard data layer.
 *
 * Aggregates (averages, trends) are computed in TypeScript over a bounded
 * recent sample rather than in SQL — the locked schema has no analytics
 * views/RPCs and Phase 6 must not add any. Precise, full-history analytics are
 * the job of Phase 13 (Reading Analytics) / Phase 14 (Performance); here we keep
 * reads light and clearly "recent"-scoped.
 */

/** Upper bound on rows pulled to compute averages/trends. */
export const STATS_SAMPLE_LIMIT = 500;
/** Upper bound on a single student's session scan for exact passage/vocab totals. */
export const PASSAGE_SCAN_LIMIT = 2000;
/** Average accuracy (%) at or below which a reader is flagged "at risk". */
export const AT_RISK_ACCURACY = 80;
/** Upper bound on rows pulled to rank student insights. */
export const INSIGHT_SAMPLE_LIMIT = 1000;
/** How many recent sessions to show in an activity list. */
export const RECENT_LIMIT = 8;
/** Trailing window (days) for the sessions trend sparkline. */
export const TREND_DAYS = 7;
/** Soft weekly session target for the student progress ring. */
export const WEEKLY_TARGET = 5;
/** How many students to surface as "needs attention". */
export const INSIGHT_COUNT = 5;

/** Coerce a possibly-stringified numeric (PostgREST `numeric`) to a number. */
export function toNum(value: number | string | null): number | null {
  if (value == null) return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Mean of the values, or `null` when there are none. */
export function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** Narrowing filter that drops `null`s from a numeric list. */
export function isNumber(value: number | null): value is number {
  return value !== null;
}

/** Shape of an embedded recent-session row (joined student + passage). */
export type RecentSessionRow = {
  id: string;
  words_per_minute: number | null;
  accuracy_percentage: number | null;
  completed_at: string | null;
  created_at: string;
  student: {
    first_name_ar: string;
    last_name_ar: string;
    first_name_en: string | null;
    last_name_en: string | null;
  } | null;
  passage: { title_ar: string; title_en: string | null } | null;
};

/** Resolve an embedded session row to its display view-model. */
export function toRecentSessionView(
  row: RecentSessionRow,
  locale: string,
): RecentSessionView {
  return {
    id: row.id,
    studentName: row.student ? studentDisplayName(row.student, locale) : "",
    passageTitle: row.passage ? passageTitle(row.passage, locale) : "",
    wpm: toNum(row.words_per_minute),
    accuracy: toNum(row.accuracy_percentage),
    at: row.completed_at ?? row.created_at,
  };
}

/** Counts of timestamps bucketed per day over the trailing window, old → new. */
export function dailyCountsTrend(dates: string[], days = TREND_DAYS): number[] {
  const buckets = new Array<number>(days).fill(0);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  for (const iso of dates) {
    const day = new Date(iso);
    day.setHours(0, 0, 0, 0);
    const daysAgo = Math.floor(
      (startOfToday.getTime() - day.getTime()) / 86_400_000,
    );
    if (daysAgo >= 0 && daysAgo < days) {
      buckets[days - 1 - daysAgo] += 1;
    }
  }
  return buckets;
}

/** Start of the current week (Saturday, the common week start for Arabic locales). */
export function startOfWeek(now = new Date()): Date {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  // getDay(): 0=Sun … 6=Sat. Days since the most recent Saturday.
  const daysSinceSaturday = (date.getDay() + 1) % 7;
  date.setDate(date.getDate() - daysSinceSaturday);
  return date;
}
