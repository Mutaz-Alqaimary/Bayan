/**
 * Reading-analytics composite view models (Phase 13).
 *
 * The *resolved, serializable* shapes the analytics UI renders — assembled in
 * the server-only data layer (`reading/queries.ts`) from the shared building
 * blocks in `features/analytics/types.ts`. The UI consumes these, never raw DB
 * rows (spec §8a). Both top-level shapes are discriminated by
 * `AnalyticsAvailability` so the two empty states stay distinct (spec §11a.4).
 */

import type { TimeRange } from "@/features/analytics/time-range";
import type {
  AiInsightsSection,
  AnalyticsInsight,
  AnalyticsTrendSeries,
  AssignmentsAnalyticsSection,
  TrendIndicator,
  VocabularyAnalyticsSection,
} from "@/features/analytics/types";
import type { ReadingSessionView } from "@/features/reading/sessions/types";

/** The reading insights the engine can emit (spec §5). */
export type ReadingInsightKind =
  | "wpm_improving"
  | "wpm_declining"
  | "accuracy_improving"
  | "accuracy_declining"
  | "accuracy_low"
  | "steady_progress"
  | "needs_more_data";

/** A reading insight — the shared descriptor narrowed to reading `kind`s. */
export type ReadingInsight = AnalyticsInsight & { kind: ReadingInsightKind };

/**
 * A cohort student rendered as a compact dashboard card (spec §11a.3): identity
 * + average speed/accuracy + a within-cohort WPM trend + a risk flag — enough to
 * compare students before drilling in.
 */
export type StudentAnalyticsCard = {
  id: string;
  name: string;
  grade: number;
  avgWpm: number | null;
  avgAccuracy: number | null;
  /** Current-period avg WPM vs. the comparison period (`comparable=false` for `all`). */
  wpmTrend: TrendIndicator;
  /** Average accuracy at or below `AT_RISK_ACCURACY`. */
  atRisk: boolean;
  sessionsCount: number;
};

/** Cohort KPIs, each carrying its direction vs. the comparison period (§11a.1). */
export type CohortReadingKpis = {
  avgWpm: TrendIndicator;
  avgAccuracy: TrendIndicator;
  activeReaders: TrendIndicator;
  sessions: TrendIndicator;
};

/** Cohort (admin/teacher) reading analytics for the selected range. */
export type CohortReadingAnalytics =
  | { availability: "empty_all" }
  | { availability: "empty_range"; range: TimeRange }
  | {
      availability: "ready";
      range: TimeRange;
      kpis: CohortReadingKpis;
      wpm: AnalyticsTrendSeries;
      accuracy: AnalyticsTrendSeries;
      activity: AnalyticsTrendSeries;
      /** Weakest readers first — the primary drill-down entry (spec §7). */
      needsAttention: StudentAnalyticsCard[];
      /** The full cohort, for the student-cards/list. */
      students: StudentAnalyticsCard[];
    };

/** Minimal student identity carried by every per-student availability state. */
export type StudentAnalyticsIdentity = {
  id: string;
  name: string;
  grade: number;
};

/** Per-student KPIs — speed/accuracy carry direction; counts are plain totals. */
export type StudentReadingKpis = {
  avgWpm: TrendIndicator;
  avgAccuracy: TrendIndicator;
  bestWpm: number | null;
  sessions: number;
  passagesRead: number;
  vocabularyExposed: number;
};

/** One student's reading analytics for the selected range. */
export type StudentReadingAnalytics =
  | { availability: "empty_all"; student: StudentAnalyticsIdentity }
  | { availability: "empty_range"; student: StudentAnalyticsIdentity; range: TimeRange }
  | {
      availability: "ready";
      student: StudentAnalyticsIdentity;
      range: TimeRange;
      kpis: StudentReadingKpis;
      wpm: AnalyticsTrendSeries;
      accuracy: AnalyticsTrendSeries;
      duration: AnalyticsTrendSeries;
      insights: ReadingInsight[];
      recentSessions: ReadingSessionView[];
      /**
       * Reserved extension points (spec §11a.5 / §14) — **never populated in
       * Phase 13**, declared so future modules attach additively without
       * redesign. No queries or UI back these today.
       */
      vocabulary?: VocabularyAnalyticsSection;
      aiInsights?: AiInsightsSection;
      assignments?: AssignmentsAnalyticsSection;
    };
