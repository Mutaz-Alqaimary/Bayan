import "server-only";

import {
  getCohortReadingAnalytics,
  getStudentReadingAnalytics,
} from "@/features/analytics/reading/queries";
import type { TimeRange } from "@/features/analytics/time-range";
import { requireRole } from "@/features/auth/guards";

import { buildReportMeta } from "./report-meta";
import type { CohortReport, StudentReport } from "./types";

/**
 * Server-only report reads (Phase 18), admin + teacher only.
 *
 * Reporting is a **presentation layer over Phase 13**: these functions call the
 * existing analytics queries and wrap their view models with document metadata —
 * they never re-read `reading_sessions` or duplicate any aggregation. Reads go
 * through the same session client under the same Phase 17 RLS (`is_staff()`); no
 * service-role, no new privilege, no schema change. The role gate runs here as
 * defense in depth (the analytics queries gate again internally), and its
 * returned `SessionUser` **doubles as the byline source** — so no extra
 * `getSessionUser()` round-trip is spent. `generatedAt` is resolved **once** and
 * injected into the pure `buildReportMeta`, so composition stays deterministic.
 */

/**
 * The program/cohort report for the selected range. Inherits the two empty
 * states from analytics (`empty_all` vs `empty_range`) so the document can guide
 * the user to widen the range instead of showing a bare "no data".
 */
export async function getCohortReport(range: TimeRange): Promise<CohortReport> {
  const user = await requireRole("admin", "teacher");
  const analytics = await getCohortReadingAnalytics(range);

  return {
    kind: "cohort",
    meta: buildReportMeta({
      range,
      generatedAt: new Date().toISOString(),
      generatedByName: user.profile.full_name,
    }),
    analytics,
  };
}

/**
 * A single student's progress report, resolved by `students.id`. Returns `null`
 * when the id matches no student (the route renders a 404), matching the
 * analytics layer's contract.
 */
export async function getStudentReport(
  studentId: string,
  range: TimeRange,
): Promise<StudentReport | null> {
  const user = await requireRole("admin", "teacher");
  const analytics = await getStudentReadingAnalytics(studentId, range);

  if (!analytics) return null;

  return {
    kind: "student",
    meta: buildReportMeta({
      range,
      generatedAt: new Date().toISOString(),
      generatedByName: user.profile.full_name,
    }),
    analytics,
  };
}
