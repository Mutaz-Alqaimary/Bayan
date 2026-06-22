import "server-only";

import { getLocale } from "next-intl/server";

import type {
  StudentInsightView,
  TeacherDashboardData,
} from "@/features/dashboard/types";
import { studentDisplayName } from "@/features/students/types";
import { supabaseServerClient } from "@/lib/supabase/server";

import {
  average,
  dailyCountsTrend,
  INSIGHT_COUNT,
  INSIGHT_SAMPLE_LIMIT,
  isNumber,
  RECENT_LIMIT,
  STATS_SAMPLE_LIMIT,
  toNum,
  toRecentSessionView,
  type RecentSessionRow,
} from "./shared";

type StatsRow = {
  words_per_minute: number | null;
  accuracy_percentage: number | null;
  created_at: string;
};

type StudentRow = {
  id: string;
  first_name_ar: string;
  last_name_ar: string;
  first_name_en: string | null;
  last_name_en: string | null;
  grade: number;
};

type InsightSessionRow = {
  student_id: string;
  words_per_minute: number | null;
  accuracy_percentage: number | null;
};

const RECENT_SELECT =
  "id, words_per_minute, accuracy_percentage, completed_at, created_at, student:students(first_name_ar,last_name_ar,first_name_en,last_name_en), passage:reading_passages(title_ar,title_en)";

/** Rank students by weakest reading performance (lowest accuracy, then WPM). */
function rankStrugglingReaders(
  students: StudentRow[],
  sessions: InsightSessionRow[],
  locale: string,
): StudentInsightView[] {
  const byStudent = new Map<
    string,
    { wpm: number[]; accuracy: number[]; count: number }
  >();

  for (const session of sessions) {
    const bucket = byStudent.get(session.student_id) ?? {
      wpm: [],
      accuracy: [],
      count: 0,
    };
    bucket.count += 1;
    const wpm = toNum(session.words_per_minute);
    if (wpm !== null) bucket.wpm.push(wpm);
    const accuracy = toNum(session.accuracy_percentage);
    if (accuracy !== null) bucket.accuracy.push(accuracy);
    byStudent.set(session.student_id, bucket);
  }

  return students
    .filter((student) => byStudent.has(student.id))
    .map((student) => {
      const bucket = byStudent.get(student.id)!;
      return {
        id: student.id,
        name: studentDisplayName(student, locale),
        grade: student.grade,
        avgWpm: average(bucket.wpm),
        avgAccuracy: average(bucket.accuracy),
        sessionsCount: bucket.count,
      };
    })
    .sort(
      (a, b) =>
        (a.avgAccuracy ?? Infinity) - (b.avgAccuracy ?? Infinity) ||
        (a.avgWpm ?? Infinity) - (b.avgWpm ?? Infinity),
    )
    .slice(0, INSIGHT_COUNT);
}

/** Class-wide progress overview for the teacher dashboard. */
export async function getTeacherDashboardData(): Promise<TeacherDashboardData> {
  const locale = await getLocale();
  const supabase = await supabaseServerClient();

  const [
    students,
    passages,
    sessions,
    vocabulary,
    statsRes,
    recentRes,
    studentsListRes,
    insightSessionsRes,
  ] = await Promise.all([
    supabase.from("students").select("*", { count: "exact", head: true }),
    supabase
      .from("reading_passages")
      .select("*", { count: "exact", head: true }),
    supabase.from("reading_sessions").select("*", { count: "exact", head: true }),
    supabase
      .from("vocabulary_terms")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("reading_sessions")
      .select("words_per_minute, accuracy_percentage, created_at")
      .order("created_at", { ascending: false })
      .limit(STATS_SAMPLE_LIMIT)
      .returns<StatsRow[]>(),
    supabase
      .from("reading_sessions")
      .select(RECENT_SELECT)
      .order("created_at", { ascending: false })
      .limit(RECENT_LIMIT)
      .returns<RecentSessionRow[]>(),
    supabase
      .from("students")
      .select(
        "id, first_name_ar, last_name_ar, first_name_en, last_name_en, grade",
      )
      .returns<StudentRow[]>(),
    supabase
      .from("reading_sessions")
      .select("student_id, words_per_minute, accuracy_percentage")
      .order("created_at", { ascending: false })
      .limit(INSIGHT_SAMPLE_LIMIT)
      .returns<InsightSessionRow[]>(),
  ]);

  const error =
    students.error ??
    passages.error ??
    sessions.error ??
    vocabulary.error ??
    statsRes.error ??
    recentRes.error ??
    studentsListRes.error ??
    insightSessionsRes.error;
  if (error) {
    throw new Error(`Failed to load teacher dashboard: ${error.message}`);
  }

  const sample = statsRes.data ?? [];
  const wpm = sample.map((s) => toNum(s.words_per_minute)).filter(isNumber);
  const accuracy = sample
    .map((s) => toNum(s.accuracy_percentage))
    .filter(isNumber);

  return {
    totals: {
      students: students.count ?? 0,
      passages: passages.count ?? 0,
      sessions: sessions.count ?? 0,
      vocabulary: vocabulary.count ?? 0,
    },
    performance: {
      avgWpm: average(wpm),
      avgAccuracy: average(accuracy),
    },
    sessionsTrend: dailyCountsTrend(sample.map((s) => s.created_at)),
    recentSessions: (recentRes.data ?? []).map((row) =>
      toRecentSessionView(row, locale),
    ),
    strugglingReaders: rankStrugglingReaders(
      studentsListRes.data ?? [],
      insightSessionsRes.data ?? [],
      locale,
    ),
  };
}
