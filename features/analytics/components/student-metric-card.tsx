import { Minus, TrendingDown, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { StudentAnalyticsCard } from "@/features/analytics/reading/types";
import {
  ANALYTICS_RANGE_PARAM,
  ANALYTICS_STUDENT_PARAM,
} from "@/features/analytics/search-params";
import type { TimeRange } from "@/features/analytics/time-range";
import { Link } from "@/i18n/navigation";
import { formatNumber, formatPercent } from "@/lib/format";
import { ROUTES } from "@/lib/routes";

/** Localized labels for a student card (resolved once by the parent). */
export type StudentCardLabels = {
  grade: string;
  speed: string;
  accuracy: string;
  sessions: string;
  atRisk: string;
};

/**
 * A compact student dashboard card (spec §11a.3) that links into the per-student
 * drill-down — the primary navigation from the cohort overview (spec §7).
 * Presentation-only: it formats `card` with `lib/format` and the supplied labels.
 */
export function StudentMetricCard({
  card,
  range,
  locale,
  labels,
}: {
  card: StudentAnalyticsCard;
  range: TimeRange;
  locale: string;
  labels: StudentCardLabels;
}) {
  const TrendIcon =
    card.wpmTrend.direction === "up"
      ? TrendingUp
      : card.wpmTrend.direction === "down"
        ? TrendingDown
        : Minus;

  return (
    <Link
      href={{
        pathname: ROUTES.analytics,
        query: {
          [ANALYTICS_RANGE_PARAM]: range,
          [ANALYTICS_STUDENT_PARAM]: card.id,
        },
      }}
      className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Card className="h-full p-4 transition-colors hover:border-primary/40 hover:bg-accent/40">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{card.name}</p>
            <p className="text-xs text-muted-foreground">
              {labels.grade} {formatNumber(card.grade, locale)}
            </p>
          </div>
          {card.atRisk ? (
            <Badge variant="destructive">{labels.atRisk}</Badge>
          ) : (
            <TrendIcon
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
          )}
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-2">
          <div>
            <dt className="text-xs text-muted-foreground">{labels.speed}</dt>
            <dd className="text-sm font-semibold tabular-nums text-foreground">
              {card.avgWpm !== null ? formatNumber(card.avgWpm, locale) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">{labels.accuracy}</dt>
            <dd className="text-sm font-semibold tabular-nums text-foreground">
              {card.avgAccuracy !== null
                ? formatPercent(card.avgAccuracy, locale)
                : "—"}
            </dd>
          </div>
        </dl>
        <p className="mt-2 text-xs text-muted-foreground">
          {formatNumber(card.sessionsCount, locale)} {labels.sessions}
        </p>
      </Card>
    </Link>
  );
}
