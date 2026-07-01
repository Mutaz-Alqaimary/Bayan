/**
 * Reporting view models (Phase 18).
 *
 * Reporting is a **presentation layer over the Phase 13 analytics view models** —
 * it does not re-read raw sessions or re-implement any aggregation. A report is
 * simply one of the existing, already-resolved analytics view models
 * (`CohortReadingAnalytics` / `StudentReadingAnalytics`) wrapped with the small
 * amount of document metadata a printable, shareable report needs (who generated
 * it, when, and over which range). The empty-state distinction
 * (`empty_all` / `empty_range` / `ready`) is inherited unchanged from analytics.
 */

import type {
  CohortReadingAnalytics,
  StudentReadingAnalytics,
} from "@/features/analytics/reading/types";
import type { TimeRange } from "@/features/analytics/time-range";

/** The two report scopes, matching the two Phase 13 analytics reads. */
export type ReportKind = "cohort" | "student";

/**
 * Document metadata shared by every report. `generatedAt` is an ISO instant
 * **injected once** by the data layer (never read from the clock inside pure
 * code) so report composition stays deterministic and unit-testable — mirroring
 * how the analytics layer threads `now`.
 */
export type ReportMeta = {
  range: TimeRange;
  generatedAt: string;
  /** Display name of the staff member who generated the report, or `null`. */
  generatedByName: string | null;
};

/** A program/cohort report (administrator-facing). */
export type CohortReport = {
  kind: "cohort";
  meta: ReportMeta;
  analytics: CohortReadingAnalytics;
};

/** A single-student progress report (parent-facing). */
export type StudentReport = {
  kind: "student";
  meta: ReportMeta;
  analytics: StudentReadingAnalytics;
};

/** Either report, discriminated by `kind`. */
export type Report = CohortReport | StudentReport;
