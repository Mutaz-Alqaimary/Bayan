import "server-only";

import { getLocale } from "next-intl/server";

import {
  average,
  isNumber,
  STATS_SAMPLE_LIMIT,
  toNum,
} from "@/features/dashboard/data/shared";
import { countWords } from "@/features/reading/sessions/fluency";
import type {
  ReadablePassage,
  ReadingHistory,
  ReadingSessionsData,
  ReadingSessionView,
} from "@/features/reading/sessions/types";
import { passageTitle } from "@/features/reading/types";
import type { VocabularyTermRecord } from "@/features/reading/types";
import { supabaseServerClient } from "@/lib/supabase/server";

/**
 * Server-only reads for the student reading workflow & history (Phase 10).
 *
 * Everything is scoped to the signed-in student's own `students` row (resolved
 * from `profile_id`) — never relying on RLS alone. A student with no linked
 * roster row yet returns `{ linked: false }`, rendered as an onboarding state.
 */

/** Most recent WPM readings to chart for the history sparkline. */
const TREND_SESSIONS = 12;
/** Upper bound on history rows pulled for the list + summary. */
const HISTORY_LIMIT = 200;

type SessionRow = {
  id: string;
  words_per_minute: number | null;
  accuracy_percentage: number | null;
  duration_seconds: number | null;
  completed_at: string | null;
  created_at: string;
  passage: { title_ar: string; title_en: string | null } | null;
};

/**
 * Resolve the signed-in student's `students.id` from their profile, or `null`
 * when no roster row is linked yet. Server-only; shared by the query and the
 * commit action so both scope writes/reads to the same student.
 */
export async function getLinkedStudentId(
  profileId: string,
): Promise<string | null> {
  const supabase = await supabaseServerClient();
  const { data, error } = await supabase
    .from("students")
    .select("id")
    .eq("profile_id", profileId)
    .maybeSingle<{ id: string }>();

  if (error) {
    throw new Error(`Failed to resolve student: ${error.message}`);
  }
  return data?.id ?? null;
}

/** All passages a student can read, with Arabic word counts precomputed. */
export async function getReadablePassages(): Promise<ReadablePassage[]> {
  const supabase = await supabaseServerClient();
  const { data, error } = await supabase
    .from("reading_passages")
    .select(
      "id, title_ar, title_en, content_ar, content_en, difficulty_level, estimated_minutes",
    )
    .order("title_ar", { ascending: true })
    .returns<Omit<ReadablePassage, "word_count">[]>();

  if (error) {
    throw new Error(`Failed to load passages: ${error.message}`);
  }

  return (data ?? []).map((passage) => ({
    ...passage,
    word_count: countWords(passage.content_ar),
  }));
}

/** Columns the reader's vocabulary lookup needs (word + meaning, both scripts). */
const VOCABULARY_COLUMNS =
  "id, passage_id, word_ar, word_en, meaning_ar, meaning_en, created_at";

/**
 * The vocabulary terms attached to one passage — the reading aid shown in the
 * Phase 11 reader's vocabulary panel. Scoped to a single `passage_id` (never the
 * whole library), read under the request's RLS-respecting session client. Terms
 * are returned in insertion order; the client re-sorts with an Arabic-aware
 * collator where ordering matters.
 */
export async function getPassageVocabulary(
  passageId: string,
): Promise<VocabularyTermRecord[]> {
  const supabase = await supabaseServerClient();
  const { data, error } = await supabase
    .from("vocabulary_terms")
    .select(VOCABULARY_COLUMNS)
    .eq("passage_id", passageId)
    .order("created_at", { ascending: true })
    .returns<VocabularyTermRecord[]>();

  if (error) {
    throw new Error(`Failed to load passage vocabulary: ${error.message}`);
  }

  return data ?? [];
}

/** A student's reading history (recent sessions + progress summary). */
async function getReadingHistory(
  studentId: string,
  locale: string,
): Promise<ReadingHistory> {
  const supabase = await supabaseServerClient();
  const { data, error } = await supabase
    .from("reading_sessions")
    .select(
      "id, words_per_minute, accuracy_percentage, duration_seconds, completed_at, created_at, passage:reading_passages(title_ar,title_en)",
    )
    .eq("student_id", studentId)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(HISTORY_LIMIT)
    .returns<SessionRow[]>();

  if (error) {
    throw new Error(`Failed to load reading history: ${error.message}`);
  }

  const rows = data ?? [];

  const sessions: ReadingSessionView[] = rows.map((row) => ({
    id: row.id,
    passageTitle: row.passage ? passageTitle(row.passage, locale) : "",
    wpm: toNum(row.words_per_minute),
    accuracy: toNum(row.accuracy_percentage),
    durationSeconds: toNum(row.duration_seconds),
    at: row.completed_at ?? row.created_at,
  }));

  const sample = rows.slice(0, STATS_SAMPLE_LIMIT);
  const wpmValues = sample
    .map((row) => toNum(row.words_per_minute))
    .filter(isNumber);
  const accuracyValues = sample
    .map((row) => toNum(row.accuracy_percentage))
    .filter(isNumber);

  // Recent WPM readings, reversed to oldest → newest for the sparkline.
  const wpmTrend = sessions
    .map((session) => session.wpm)
    .filter(isNumber)
    .slice(0, TREND_SESSIONS)
    .reverse();

  return {
    summary: {
      sessions: sessions.length,
      avgWpm: average(wpmValues),
      bestWpm: wpmValues.length > 0 ? Math.max(...wpmValues) : null,
      avgAccuracy: average(accuracyValues),
      wpmTrend,
    },
    sessions,
  };
}

/** Everything the reading-sessions page needs, scoped to the signed-in student. */
export async function getReadingSessionsData(
  profileId: string,
): Promise<ReadingSessionsData> {
  const studentId = await getLinkedStudentId(profileId);
  if (!studentId) {
    return { linked: false };
  }

  const locale = await getLocale();
  const [passages, history] = await Promise.all([
    getReadablePassages(),
    getReadingHistory(studentId, locale),
  ]);

  return { linked: true, passages, history };
}
