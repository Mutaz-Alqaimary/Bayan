import { ArrowLeft } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import {
  ANALYTICS_RANGE_PARAM,
} from "@/features/analytics/search-params";
import { TimeRangeTabs } from "@/features/analytics/components/time-range-tabs";
import {
  StudentPicker,
  type PickerStudent,
} from "@/features/analytics/components/student-picker";
import type { TimeRange } from "@/features/analytics/time-range";
import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

import { PrintButton } from "./print-button";

/**
 * On-screen controls for the reporting surface — the "report builder": pick the
 * range, pick the scope (cohort, or drill into one student via the reused
 * analytics picker), and print. Excluded from the printout (`print:hidden`) so
 * the saved PDF is just the document. The range tabs and student picker are the
 * Phase 13 components reused with `pathname={ROUTES.reports}` — no forked chrome.
 */
export async function ReportToolbar({
  kind,
  range,
  studentId,
  students,
}: {
  kind: "cohort" | "student";
  range: TimeRange;
  studentId: string | null;
  /** Cohort-view picker options; omitted (unused) in the student view. */
  students: PickerStudent[];
}) {
  const t = await getTranslations("reports");
  const locale = await getLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <div className="print:hidden flex flex-col gap-3 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
        <div className="shrink-0">
          <TimeRangeTabs
            range={range}
            studentId={studentId}
            pathname={ROUTES.reports}
          />
        </div>
        {kind === "cohort" ? (
          <div className="w-full sm:w-60">
            <StudentPicker
              students={students}
              range={range}
              label={t("picker.label")}
              placeholder={t("picker.placeholder")}
              emptyText={t("picker.empty")}
              pathname={ROUTES.reports}
            />
          </div>
        ) : (
          <Link
            href={{
              pathname: ROUTES.reports,
              query: { [ANALYTICS_RANGE_PARAM]: range },
            }}
            className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft
              className={cn("size-4", dir === "rtl" && "rotate-180")}
              aria-hidden="true"
            />
            {t("backToCohort")}
          </Link>
        )}
      </div>

      <div className="shrink-0">
        <PrintButton />
      </div>
    </div>
  );
}
