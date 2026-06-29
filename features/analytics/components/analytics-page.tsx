import { getTranslations } from "next-intl/server";

import type {
  CohortReadingAnalytics,
  StudentReadingAnalytics,
} from "@/features/analytics/reading/types";
import type { TimeRange } from "@/features/analytics/time-range";

import { CohortOverview } from "./cohort-overview";
import { StudentAnalytics } from "./student-analytics";
import { TimeRangeTabs } from "./time-range-tabs";

/** Which view the page resolved from the URL (`?student=` → drill-down). */
export type AnalyticsView =
  | { kind: "cohort"; data: CohortReadingAnalytics }
  | { kind: "student"; data: StudentReadingAnalytics };

/**
 * The `/analytics` shell (admin + teacher): page header + time-range tabs, then
 * the cohort overview or the per-student drill-down. State lives entirely in the
 * URL (range + student), so this is a Server Component with no client state.
 */
export async function AnalyticsPage({
  view,
  range,
  studentId,
}: {
  view: AnalyticsView;
  range: TimeRange;
  studentId: string | null;
}) {
  const t = await getTranslations("analytics");

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <TimeRangeTabs range={range} studentId={studentId} />
      </header>

      {view.kind === "cohort" ? (
        <CohortOverview data={view.data} range={range} />
      ) : (
        <StudentAnalytics data={view.data} range={range} />
      )}
    </div>
  );
}
