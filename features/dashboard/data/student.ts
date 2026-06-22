import "server-only";

import { getLocale } from "next-intl/server";

import type { RecentSessionView, StudentDashboardData } from "@/features/dashboard/types";
import { passageTitle } from "@/features/reading/types";
import { studentDisplayName } from "@/features/students/types";
import { supabaseServerClient } from "@/lib/supabase/server";

import {
  average,
  isNumber,
  PASSAGE_SCAN_LIMIT,
  RECENT_LIMIT,
  startOfWeek,
  STATS_SAMPLE_LIMIT,
  toNum,
  WEEKLY_TARGET,
} from "./shared";

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
  completed_at: string | null;
  created_at: string;
  passage: { title_ar: string; title_en: string | null } | null;
};

/** Most recent sessions to chart for the WPM sparkline. */
const TREND_SESSIONS = 10;

/**
 * Personal progress overview for the student dashboard.
 *
 * Scoped to the signed-in student's own `students` row (matched via
 * `students.profile_id`). A self-registered student whose teacher hasn't created
 * their reading profile yet has no such row → `{ linked: false }`, which the UI
 * renders as an onboarding empty state.
 *
 * `reading_sessions` RLS is permissive (authenticated can read all), so scoping
 * to `student_id` is enforced here in the query — never relying on RLS alone.
 */
export async function getStudentDashboardData(
  profileId: string,
): Promise<StudentDashboardData> {
  const locale = await getLocale();
  const supabase = await supabaseServerClient();

  const { data: student, error: studentError } = await supabase
    .from("students")
    .select(
      "id, first_name_ar, last_name_ar, first_name_en, last_name_en, grade",
    )
    .eq("profile_id", profileId)
    .maybeSingle<StudentRow>();

  if (studentError) {
    throw new Error(`Failed to load student dashboard: ${studentError.message}`);
  }
  if (!student) {
    return { linked: false };
  }

  const [completed, sampleRes, passageScanRes] = await Promise.all([
    supabase
      .from("reading_sessions")
      .select("*", { count: "exact", head: true })
      .eq("student_id", student.id)
      .not("completed_at", "is", null),
    supabase
      .from("reading_sessions")
      .select(
        "id, passage_id, words_per_minute, accuracy_percentage, completed_at, created_at, passage:reading_passages(title_ar,title_en)",
      )
      .eq("student_id", student.id)
      .order("created_at", { ascending: false })
      .limit(STATS_SAMPLE_LIMIT)
      .returns<StudentSessionRow[]>(),
    // Distinct passages/vocabulary are totals (like sessionsCompleted), so they
    // are derived from a dedicated id-only scan rather than the recent-stats
    // sample, keeping all student KPIs consistently full-history.
    supabase
      .from("reading_sessions")
      .select("passage_id")
      .eq("student_id", student.id)
      .limit(PASSAGE_SCAN_LIMIT)
      .returns<{ passage_id: string }[]>(),
  ]);

  const error = completed.error ?? sampleRes.error ?? passageScanRes.error;
  if (error) {
    throw new Error(`Failed to load student dashboard: ${error.message}`);
  }

  const sessions = sampleRes.data ?? [];
  const passageIds = [
    ...new Set((passageScanRes.data ?? []).map((row) => row.passage_id)),
  ];

  let vocabularyExposed = 0;
  if (passageIds.length > 0) {
    const { count, error: vocabError } = await supabase
      .from("vocabulary_terms")
      .select("*", { count: "exact", head: true })
      .in("passage_id", passageIds);
    if (vocabError) {
      throw new Error(`Failed to load student dashboard: ${vocabError.message}`);
    }
    vocabularyExposed = count ?? 0;
  }

  const wpmValues = sessions.map((s) => toNum(s.words_per_minute)).filter(isNumber);
  const accuracyValues = sessions
    .map((s) => toNum(s.accuracy_percentage))
    .filter(isNumber);

  // Most recent WPM readings, reversed to oldest → newest for the sparkline.
  const wpmTrend = sessions
    .map((s) => toNum(s.words_per_minute))
    .filter(isNumber)
    .slice(0, TREND_SESSIONS)
    .reverse();

  const weekStart = startOfWeek();
  const completedThisWeek = sessions.filter(
    (s) => new Date(s.created_at) >= weekStart,
  ).length;

  const recentSessions: RecentSessionView[] = sessions
    .slice(0, RECENT_LIMIT)
    .map((s) => ({
      id: s.id,
      studentName: studentDisplayName(student, locale),
      passageTitle: s.passage ? passageTitle(s.passage, locale) : "",
      wpm: toNum(s.words_per_minute),
      accuracy: toNum(s.accuracy_percentage),
      at: s.completed_at ?? s.created_at,
    }));

  return {
    linked: true,
    studentName: studentDisplayName(student, locale),
    grade: student.grade,
    totals: {
      sessionsCompleted: completed.count ?? 0,
      passagesRead: passageIds.length,
      vocabularyExposed,
    },
    progress: {
      avgWpm: average(wpmValues),
      avgAccuracy: average(accuracyValues),
      bestWpm: wpmValues.length > 0 ? Math.max(...wpmValues) : null,
    },
    wpmTrend,
    weeklyActivity: { completed: completedThisWeek, target: WEEKLY_TARGET },
    recentSessions,
  };
}
