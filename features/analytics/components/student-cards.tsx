import { EmptyState } from "@/components/ui/empty-state";
import type { StudentAnalyticsCard } from "@/features/analytics/reading/types";
import type { TimeRange } from "@/features/analytics/time-range";
import { cn } from "@/lib/utils";

import {
  StudentMetricCard,
  type StudentCardLabels,
} from "./student-metric-card";

/**
 * A list/grid of student cards — the cohort drill-down surface used both for the
 * "needs attention" panel (`single`, stacked) and the full student grid
 * (spec §7). Presentation-only; renders its own empty state.
 */
export function StudentCards({
  students,
  range,
  locale,
  labels,
  emptyTitle,
  emptyDescription,
  single = false,
}: {
  students: StudentAnalyticsCard[];
  range: TimeRange;
  locale: string;
  labels: StudentCardLabels;
  emptyTitle: string;
  emptyDescription: string;
  /** Stack in one column (needs-attention rail) instead of a responsive grid. */
  single?: boolean;
}) {
  if (students.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div
      className={cn(
        single
          ? "grid grid-cols-1 gap-3"
          : "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3",
      )}
    >
      {students.map((card) => (
        <StudentMetricCard
          key={card.id}
          card={card}
          range={range}
          locale={locale}
          labels={labels}
        />
      ))}
    </div>
  );
}
