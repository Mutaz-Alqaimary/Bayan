import "server-only";

import { getLocale } from "next-intl/server";

import { requireRole } from "@/features/auth/guards";
import type { AdminDashboardData } from "@/features/dashboard/types";
import { supabaseAdminClient } from "@/lib/supabase/admin";
import { supabaseServerClient } from "@/lib/supabase/server";

import {
  average,
  dailyCountsTrend,
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

const RECENT_SELECT =
  "id, words_per_minute, accuracy_percentage, completed_at, created_at, student:students(first_name_ar,last_name_ar,first_name_en,last_name_en), passage:reading_passages(title_ar,title_en)";

/**
 * Platform-wide overview for the admin dashboard. The teacher head-count crosses
 * the `profiles` select-own RLS, so it uses the service-role client — guarded by
 * `requireRole("admin")` first (defense in depth on top of the page's branch).
 */
export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  await requireRole("admin");
  const locale = await getLocale();
  const supabase = await supabaseServerClient();
  const admin = supabaseAdminClient();

  const [students, passages, sessions, teachers, statsRes, recentRes] =
    await Promise.all([
      supabase.from("students").select("*", { count: "exact", head: true }),
      supabase
        .from("reading_passages")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("reading_sessions")
        .select("*", { count: "exact", head: true }),
      admin
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "teacher"),
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
    ]);

  const error =
    students.error ??
    passages.error ??
    sessions.error ??
    teachers.error ??
    statsRes.error ??
    recentRes.error;
  if (error) {
    throw new Error(`Failed to load admin dashboard: ${error.message}`);
  }

  const sample = statsRes.data ?? [];
  const wpm = sample.map((s) => toNum(s.words_per_minute)).filter(isNumber);
  const accuracy = sample
    .map((s) => toNum(s.accuracy_percentage))
    .filter(isNumber);

  return {
    totals: {
      students: students.count ?? 0,
      teachers: teachers.count ?? 0,
      passages: passages.count ?? 0,
      sessions: sessions.count ?? 0,
    },
    platform: {
      avgWpm: average(wpm),
      avgAccuracy: average(accuracy),
    },
    sessionsTrend: dailyCountsTrend(sample.map((s) => s.created_at)),
    recentSessions: (recentRes.data ?? []).map((row) =>
      toRecentSessionView(row, locale),
    ),
  };
}
