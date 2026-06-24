/**
 * Reading-session domain & view-model types (Phase 10).
 *
 * `ReadingSessionRecord` is the hand-authored domain type for the
 * `reading_sessions` table as documented in `.claude/rules/database-schema.md`.
 * The remaining types are the resolved, display-ready shapes the student
 * workflow and history render — built in the server-only data layer.
 */

/** A row of the `reading_sessions` table. */
export type ReadingSessionRecord = {
  id: string;
  student_id: string;
  passage_id: string;
  words_per_minute: number | null;
  accuracy_percentage: number | null;
  duration_seconds: number | null;
  completed_at: string | null;
  created_at: string;
};

/**
 * A passage reduced to what the student reader/picker needs, with the Arabic
 * word count precomputed (the basis for the WPM calculation — see `fluency.ts`).
 */
export type ReadablePassage = {
  id: string;
  title_ar: string;
  title_en: string | null;
  content_ar: string;
  content_en: string | null;
  difficulty_level: number;
  estimated_minutes: number;
  word_count: number;
};

/** A completed session resolved for display in the history list. */
export type ReadingSessionView = {
  id: string;
  passageTitle: string;
  wpm: number | null;
  accuracy: number | null;
  durationSeconds: number | null;
  /** ISO timestamp — `completed_at` when present, else `created_at`. */
  at: string;
};

/** At-a-glance personal progress over the student's recent sessions. */
export type ReadingHistorySummary = {
  sessions: number;
  avgWpm: number | null;
  bestWpm: number | null;
  avgAccuracy: number | null;
  /** WPM over recent sessions, oldest → newest (sparkline). */
  wpmTrend: number[];
};

export type ReadingHistory = {
  summary: ReadingHistorySummary;
  sessions: ReadingSessionView[];
};

/** The signed-in student has no linked `students` row yet (onboarding state). */
export type ReadingSessionsUnlinked = { linked: false };

export type ReadingSessionsLinked = {
  linked: true;
  passages: ReadablePassage[];
  history: ReadingHistory;
};

export type ReadingSessionsData =
  | ReadingSessionsUnlinked
  | ReadingSessionsLinked;

/**
 * Form values submitted to complete a session. Every field is a string (form
 * input shape). The app measures `duration_seconds` (timer) and the student
 * self-reports `errors`; the server recomputes WPM/accuracy from the passage's
 * own word count — `words_per_minute`/`accuracy_percentage` are never sent by
 * the client.
 */
export type CompleteReadingSessionFormValues = {
  passage_id: string;
  duration_seconds: string;
  errors: string;
};
