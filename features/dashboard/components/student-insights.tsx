import { getLocale, getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { AT_RISK_ACCURACY } from "@/features/dashboard/data/shared";
import type { StudentInsightView } from "@/features/dashboard/types";
import { formatNumber, formatPercent } from "@/lib/format";

/**
 * "Needs attention" list — students ranked by weakest reading performance, so a
 * teacher can spot a struggling reader at a glance (the dashboard's core job).
 * Empty state when no students have reading data yet.
 */
export async function StudentInsights({
  students,
}: {
  students: StudentInsightView[];
}) {
  const t = await getTranslations("dashboard");
  const locale = await getLocale();

  if (students.length === 0) {
    return (
      <EmptyState
        title={t("insights.emptyTitle")}
        description={t("insights.emptyDescription")}
      />
    );
  }

  return (
    <ul className="divide-y divide-border/60">
      {students.map((student) => (
        <li
          key={student.id}
          className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {student.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("insights.grade", {
                grade: formatNumber(student.grade, locale),
              })}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {student.avgWpm !== null ? (
              <Badge variant="secondary">
                {t("units.wpm", { value: formatNumber(student.avgWpm, locale) })}
              </Badge>
            ) : null}
            {student.avgAccuracy !== null ? (
              <Badge
                variant={
                  student.avgAccuracy <= AT_RISK_ACCURACY
                    ? "destructive"
                    : "outline"
                }
              >
                {formatPercent(student.avgAccuracy, locale)}
              </Badge>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
