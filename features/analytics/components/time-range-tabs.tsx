import { getTranslations } from "next-intl/server";

import {
  ANALYTICS_RANGE_PARAM,
  ANALYTICS_STUDENT_PARAM,
} from "@/features/analytics/search-params";
import { TIME_RANGES, type TimeRange } from "@/features/analytics/time-range";
import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

/**
 * The time-range selector (spec §6). Rendered as real navigation links (not
 * client state) so the range lives entirely in the URL — server-resolved and
 * deterministic. Each link preserves the drilled-in student, and the active one
 * carries `aria-current`.
 */
export async function TimeRangeTabs({
  range,
  studentId,
}: {
  range: TimeRange;
  studentId: string | null;
}) {
  const t = await getTranslations("analytics");

  return (
    <div
      role="group"
      aria-label={t("ranges.label")}
      className="inline-flex items-center gap-1 rounded-lg bg-muted p-1"
    >
      {TIME_RANGES.map((option) => {
        const active = option === range;
        return (
          <Link
            key={option}
            href={{
              pathname: ROUTES.analytics,
              query: {
                [ANALYTICS_RANGE_PARAM]: option,
                ...(studentId ? { [ANALYTICS_STUDENT_PARAM]: studentId } : {}),
              },
            }}
            aria-current={active ? "true" : undefined}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t(`ranges.${option}`)}
          </Link>
        );
      })}
    </div>
  );
}
