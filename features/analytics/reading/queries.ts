import "server-only";

import { getLocale } from "next-intl/server";

import {
  ANALYTICS_SESSION_LIMIT,
  bucketAverages,
  bucketCounts,
  computeTrendIndicator,
  toTrendSeries,
} from "@/features/analytics/aggregate";
import { deriveReadingInsights } from "@/features/analytics/reading/insights";
import type {
  CohortReadingAnalytics,
  StudentAnalyticsCard,
  StudentReadingAnalytics,
} from "@/features/analytics/reading/types";
import {
  resolveAnalyticsWindow,
  resolveBucketGranularity,
  resolveComparisonWindow,
  type AnalyticsWindow,
  type TimeRange,
} from "@/features/analytics/time-range";
import { requireRole } from "@/features/auth/guards";
import {
  AT_RISK_ACCURACY,
  average,
  INSIGHT_COUNT,
  isNumber,
  RECENT_LIMIT,
  toNum,
} from "@/features/dashboard/data/shared";
import { passageTitle } from "@/features/reading/types";
import type { ReadingSessionView } from "@/features/reading/sessions/types";
import { studentDisplayName } from "@/features/students/types";
import { supabaseServerClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";

/**
 * Server-only reading-analytics reads (Phase 13), admin + teacher only.
 *
 * Bounded, range-filtered reads through the **session client** (permissive
 * `reading_sessions`/`students` SELECT — no service-role, no new privilege),
 * aggregated in TypeScript via the pure `aggregate.ts` helpers (which reuse the
 * dashboard layer — single source of truth, spec §8). Returns stable, serializable
 * view models — never raw rows (spec §8a). Determinism: `now` is resolved once and
 * threaded into the pure windowing/bucketing (spec §11).
 */

type SupabaseServer = Awaited<ReturnType<typeof supabaseServerClient>>;

type SessionStatsRow = {
  student_id: string;
  words_per_minute: number | null;
  accuracy_percentage: number | null;
  completed_at: string | null;
};

type StudentRow = {
  id: string;
  first_name_ar: string;
  last_name_ar: string;
  first_name_en: string | null;
  last_name_en: string | null;
  grade: number;
};

type StudentSessionRow = {
  id: string;
  passage_id: string;
  words_per_minute: number | null;
  accuracy_percentage: number | null;
  duration_seconds: number | null;
  completed_at: string | null;
  passage: { title_ar: string; title_en: string | null } | null;
};

const COHORT_SELECT =
  "student_id, words_per_minute, accuracy_percentage, completed_at";
const STUDENT_SELECT =
  "id, passage_id, words_per_minute, accuracy_percentage, duration_seconds, completed_at, passage:reading_passages(title_ar,title_en)";

/**
 * Completed-session stats within a window (filters applied **before** the
 * transform stage, as the builder types require). `studentId` scopes to one
 * student; omit it for the whole cohort. `window.start === null` (the `all`
 * range) drops the lower bound.
 */
function fetchSessionStats(
  supabase: SupabaseServer,
  window: AnalyticsWindow,
  studentId: string | null,
) {
  let query = supabase
    .from("reading_sessions")
    .select(COHORT_SELECT)
    .not("completed_at", "is", null);
  if (studentId) query = query.eq("student_id", studentId);
  if (window.start) {
    query = query.gte("completed_at", window.start.toISOString());
  }
  query = query.lte("completed_at", window.end.toISOString());
  return query.limit(ANALYTICS_SESSION_LIMIT).returns<SessionStatsRow[]>();
}

/** One student's windowed sessions with the passage join (oldest → newest). */
function fetchStudentSessions(
  supabase: SupabaseServer,
  window: AnalyticsWindow,
  studentId: string,
) {
  let query = supabase
    .from("reading_sessions")
    .select(STUDENT_SELECT)
    .eq("student_id", studentId)
    .not("completed_at", "is", null);
  if (window.start) {
    query = query.gte("completed_at", window.start.toISOString());
  }
  query = query.lte("completed_at", window.end.toISOString());
  return query
    .order("completed_at", { ascending: true })
    .limit(ANALYTICS_SESSION_LIMIT)
    .returns<StudentSessionRow[]>();
}

/** Empty comparison result for the `all` range (no preceding window). */
const NO_COMPARISON = Promise.resolve({
  data: [] as SessionStatsRow[],
  error: null,
});

/** Per-student accumulation of WPM/accuracy/count from a set of session rows. */
type StudentStats = { wpm: number[]; accuracy: number[]; count: number };

function accumulateByStudent(rows: SessionStatsRow[]): Map<string, StudentStats> {
  const map = new Map<string, StudentStats>();
  for (const row of rows) {
    const stats = map.get(row.student_id) ?? { wpm: [], accuracy: [], count: 0 };
    stats.count += 1;
    const wpm = toNum(row.words_per_minute);
    if (wpm !== null) stats.wpm.push(wpm);
    const accuracy = toNum(row.accuracy_percentage);
    if (accuracy !== null) stats.accuracy.push(accuracy);
    map.set(row.student_id, stats);
  }
  return map;
}

/** All WPM / accuracy values across rows (nulls dropped) — for cohort KPIs. */
function flatValues(rows: SessionStatsRow[]): { wpm: number[]; accuracy: number[] } {
  return {
    wpm: rows.map((row) => toNum(row.words_per_minute)).filter(isNumber),
    accuracy: rows.map((row) => toNum(row.accuracy_percentage)).filter(isNumber),
  };
}

/** Distinct active readers in a row set. */
function distinctReaders(rows: SessionStatsRow[]): number {
  return new Set(rows.map((row) => row.student_id)).size;
}

/**
 * Cohort (platform/class) reading analytics for the selected range. Distinguishes
 * "no data at all" (`empty_all`) from "none in this range" (`empty_range`) so the
 * UI can guide the user to widen the range (spec §11a.4).
 */
export async function getCohortReadingAnalytics(
  range: TimeRange,
): Promise<CohortReadingAnalytics> {
  await requireRole("admin", "teacher");
  const locale = await getLocale();
  const supabase = await supabaseServerClient();

  const now = new Date();
  const window = resolveAnalyticsWindow(range, now);
  const comparison = resolveComparisonWindow(range, now);
  const granularity = resolveBucketGranularity(range);
  const label = (date: Date) => formatDate(date, locale);

  const [currentRes, comparisonRes, studentsRes] = await Promise.all([
    fetchSessionStats(supabase, window, null),
    comparison ? fetchSessionStats(supabase, comparison, null) : NO_COMPARISON,
    supabase
      .from("students")
      .select("id, first_name_ar, last_name_ar, first_name_en, last_name_en, grade")
      .returns<StudentRow[]>(),
  ]);

  const error = currentRes.error ?? comparisonRes.error ?? studentsRes.error;
  if (error) {
    throw new Error(`Failed to load cohort analytics: ${error.message}`);
  }

  const current = currentRes.data ?? [];

  if (current.length === 0) {
    const { count, error: existsError } = await supabase
      .from("reading_sessions")
      .select("id", { count: "exact", head: true })
      .not("completed_at", "is", null);
    if (existsError) {
      throw new Error(`Failed to load cohort analytics: ${existsError.message}`);
    }
    return (count ?? 0) === 0
      ? { availability: "empty_all" }
      : { availability: "empty_range", range };
  }

  const comparisonRows = comparisonRes.data ?? [];
  const students = studentsRes.data ?? [];
  const hasComparison = comparison !== null;

  const curValues = flatValues(current);
  const prevValues = flatValues(comparisonRows);
  const curByStudent = accumulateByStudent(current);
  const prevByStudent = accumulateByStudent(comparisonRows);

  const cards: StudentAnalyticsCard[] = students
    .filter((student) => curByStudent.has(student.id))
    .map((student) => {
      const stats = curByStudent.get(student.id)!;
      const prev = prevByStudent.get(student.id);
      const avgWpm = average(stats.wpm);
      const avgAccuracy = average(stats.accuracy);
      return {
        id: student.id,
        name: studentDisplayName(student, locale),
        grade: student.grade,
        avgWpm,
        avgAccuracy,
        wpmTrend: computeTrendIndicator(avgWpm, prev ? average(prev.wpm) : null),
        atRisk: avgAccuracy !== null && avgAccuracy <= AT_RISK_ACCURACY,
        sessionsCount: stats.count,
      };
    });

  // Weakest readers first (lowest accuracy, then lowest WPM) — nulls last. This
  // mirrors the dashboard's struggling-reader ordering; the averages themselves
  // come from the shared `average` helper (no forked aggregation).
  const needsAttention = [...cards]
    .sort(
      (a, b) =>
        (a.avgAccuracy ?? Infinity) - (b.avgAccuracy ?? Infinity) ||
        (a.avgWpm ?? Infinity) - (b.avgWpm ?? Infinity),
    )
    .slice(0, INSIGHT_COUNT);

  const sortedStudents = [...cards].sort((a, b) =>
    a.name.localeCompare(b.name, locale),
  );

  return {
    availability: "ready",
    range,
    kpis: {
      avgWpm: computeTrendIndicator(
        average(curValues.wpm),
        hasComparison ? average(prevValues.wpm) : null,
      ),
      avgAccuracy: computeTrendIndicator(
        average(curValues.accuracy),
        hasComparison ? average(prevValues.accuracy) : null,
      ),
      activeReaders: computeTrendIndicator(
        distinctReaders(current),
        hasComparison ? distinctReaders(comparisonRows) : null,
      ),
      sessions: computeTrendIndicator(
        current.length,
        hasComparison ? comparisonRows.length : null,
      ),
    },
    wpm: toTrendSeries(
      bucketAverages(
        current.map((row) => ({
          at: row.completed_at!,
          value: toNum(row.words_per_minute),
        })),
        window.start,
        window.end,
        granularity,
        label,
      ),
    ),
    accuracy: toTrendSeries(
      bucketAverages(
        current.map((row) => ({
          at: row.completed_at!,
          value: toNum(row.accuracy_percentage),
        })),
        window.start,
        window.end,
        granularity,
        label,
      ),
    ),
    activity: toTrendSeries(
      bucketCounts(
        current.map((row) => ({ at: row.completed_at! })),
        window.start,
        window.end,
        granularity,
        label,
      ),
    ),
    needsAttention,
    students: sortedStudents,
  };
}

/**
 * One student's reading analytics for the selected range, resolved by
 * `students.id`. Same two-empty-state distinction as the cohort read. Returns
 * `null` when the id matches no student, so the route renders a graceful 404
 * (`notFound()`) rather than surfacing a thrown error.
 */
export async function getStudentReadingAnalytics(
  studentId: string,
  range: TimeRange,
): Promise<StudentReadingAnalytics | null> {
  await requireRole("admin", "teacher");
  const locale = await getLocale();
  const supabase = await supabaseServerClient();

  const { data: studentRow, error: studentError } = await supabase
    .from("students")
    .select("id, first_name_ar, last_name_ar, first_name_en, last_name_en, grade")
    .eq("id", studentId)
    .maybeSingle<StudentRow>();

  if (studentError) {
    throw new Error(`Failed to load student analytics: ${studentError.message}`);
  }
  if (!studentRow) {
    return null;
  }

  const student = {
    id: studentRow.id,
    name: studentDisplayName(studentRow, locale),
    grade: studentRow.grade,
  };

  const now = new Date();
  const window = resolveAnalyticsWindow(range, now);
  const comparison = resolveComparisonWindow(range, now);
  const granularity = resolveBucketGranularity(range);
  const label = (date: Date) => formatDate(date, locale);

  const [currentRes, comparisonRes] = await Promise.all([
    fetchStudentSessions(supabase, window, studentId),
    comparison
      ? fetchSessionStats(supabase, comparison, studentId)
      : NO_COMPARISON,
  ]);

  const error = currentRes.error ?? comparisonRes.error;
  if (error) {
    throw new Error(`Failed to load student analytics: ${error.message}`);
  }

  const current = currentRes.data ?? [];

  if (current.length === 0) {
    const { count, error: existsError } = await supabase
      .from("reading_sessions")
      .select("id", { count: "exact", head: true })
      .eq("student_id", studentId)
      .not("completed_at", "is", null);
    if (existsError) {
      throw new Error(`Failed to load student analytics: ${existsError.message}`);
    }
    return (count ?? 0) === 0
      ? { availability: "empty_all", student }
      : { availability: "empty_range", student, range };
  }

  const comparisonRows = comparisonRes.data ?? [];

  const wpmValues = current.map((row) => toNum(row.words_per_minute)).filter(isNumber);
  const accuracyValues = current
    .map((row) => toNum(row.accuracy_percentage))
    .filter(isNumber);
  const prevWpm = comparisonRows
    .map((row) => toNum(row.words_per_minute))
    .filter(isNumber);
  const prevAccuracy = comparisonRows
    .map((row) => toNum(row.accuracy_percentage))
    .filter(isNumber);
  const hasComparison = comparison !== null;

  const passageIds = [...new Set(current.map((row) => row.passage_id))];
  let vocabularyExposed = 0;
  if (passageIds.length > 0) {
    const { count, error: vocabError } = await supabase
      .from("vocabulary_terms")
      .select("id", { count: "exact", head: true })
      .in("passage_id", passageIds);
    if (vocabError) {
      throw new Error(`Failed to load student analytics: ${vocabError.message}`);
    }
    vocabularyExposed = count ?? 0;
  }

  const recentSessions: ReadingSessionView[] = [...current]
    .reverse()
    .slice(0, RECENT_LIMIT)
    .map((row) => ({
      id: row.id,
      passageTitle: row.passage ? passageTitle(row.passage, locale) : "",
      wpm: toNum(row.words_per_minute),
      accuracy: toNum(row.accuracy_percentage),
      durationSeconds: toNum(row.duration_seconds),
      at: row.completed_at!,
    }));

  const avgAccuracy = average(accuracyValues);

  return {
    availability: "ready",
    student,
    range,
    kpis: {
      avgWpm: computeTrendIndicator(
        average(wpmValues),
        hasComparison ? average(prevWpm) : null,
      ),
      avgAccuracy: computeTrendIndicator(
        avgAccuracy,
        hasComparison ? average(prevAccuracy) : null,
      ),
      bestWpm: wpmValues.length > 0 ? Math.max(...wpmValues) : null,
      sessions: current.length,
      passagesRead: passageIds.length,
      vocabularyExposed,
    },
    wpm: toTrendSeries(
      bucketAverages(
        current.map((row) => ({
          at: row.completed_at!,
          value: toNum(row.words_per_minute),
        })),
        window.start,
        window.end,
        granularity,
        label,
      ),
    ),
    accuracy: toTrendSeries(
      bucketAverages(
        current.map((row) => ({
          at: row.completed_at!,
          value: toNum(row.accuracy_percentage),
        })),
        window.start,
        window.end,
        granularity,
        label,
      ),
    ),
    duration: toTrendSeries(
      bucketAverages(
        current.map((row) => ({
          at: row.completed_at!,
          value: toNum(row.duration_seconds),
        })),
        window.start,
        window.end,
        granularity,
        label,
      ),
    ),
    insights: deriveReadingInsights({
      wpmValues,
      accuracyValues,
      avgAccuracy,
      sessionsCount: current.length,
    }),
    recentSessions,
  };
}
