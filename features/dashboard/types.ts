/**
 * Dashboard view-model types.
 *
 * These are the *resolved, display-ready* shapes the role dashboards render —
 * built in the server-only data layer (`features/dashboard/data/*`) from the
 * locked-schema record types. Names and passage titles are already resolved to
 * the active locale; numeric values stay raw so components can format them
 * (Western numerals via `lib/format.ts`) and draw lightweight visuals.
 *
 * `accuracy*` values are on a 0–100 scale (matching `accuracy_percentage`).
 */

/** A recent reading session, resolved for display in an activity list. */
export type RecentSessionView = {
  id: string;
  studentName: string;
  passageTitle: string;
  wpm: number | null;
  accuracy: number | null;
  /** ISO timestamp — `completed_at` when present, else `created_at`. */
  at: string;
};

/** A student surfaced as an at-a-glance insight (e.g. struggling readers). */
export type StudentInsightView = {
  id: string;
  name: string;
  grade: number;
  avgWpm: number | null;
  avgAccuracy: number | null;
  sessionsCount: number;
};

export type AdminDashboardData = {
  totals: {
    students: number;
    teachers: number;
    passages: number;
    sessions: number;
  };
  platform: {
    avgWpm: number | null;
    avgAccuracy: number | null;
  };
  /** Sessions per day across the trailing window, oldest → newest. */
  sessionsTrend: number[];
  recentSessions: RecentSessionView[];
};

export type TeacherDashboardData = {
  totals: {
    students: number;
    passages: number;
    sessions: number;
    vocabulary: number;
  };
  performance: {
    avgWpm: number | null;
    avgAccuracy: number | null;
  };
  /** Sessions per day across the trailing window, oldest → newest. */
  sessionsTrend: number[];
  recentSessions: RecentSessionView[];
  strugglingReaders: StudentInsightView[];
};

/** The signed-in student has no linked `students` row yet (onboarding state). */
export type StudentDashboardUnlinked = { linked: false };

export type StudentDashboardLinked = {
  linked: true;
  studentName: string;
  grade: number;
  totals: {
    sessionsCompleted: number;
    passagesRead: number;
    vocabularyExposed: number;
  };
  progress: {
    avgWpm: number | null;
    avgAccuracy: number | null;
    bestWpm: number | null;
  };
  /** WPM over recent sessions, oldest → newest (sparkline). */
  wpmTrend: number[];
  /** Sessions completed this week toward a soft weekly target. */
  weeklyActivity: { completed: number; target: number };
  recentSessions: RecentSessionView[];
};

export type StudentDashboardData =
  | StudentDashboardUnlinked
  | StudentDashboardLinked;
