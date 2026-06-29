import { Minus, TrendingDown, TrendingUp } from "lucide-react";

import { Card } from "@/components/ui/card";
import type { TrendIndicator } from "@/features/analytics/types";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Localized chrome for a KPI's trend chip. */
export type KpiTrendLabels = {
  /** e.g. "vs. previous period". */
  vsComparison: string;
  /** e.g. "no prior data". */
  noComparison: string;
};

/**
 * A KPI tile: label, large value, and (when a comparison exists) a trend chip
 * showing direction + percentage change vs. the comparison period (spec §11a.1).
 * Presentation-only — the parent formats `value` and supplies localized labels.
 * `trend` is optional: count KPIs with no comparison omit the chip entirely.
 */
export function AnalyticsKpi({
  label,
  value,
  trend,
  locale,
  labels,
}: {
  label: string;
  value: string;
  trend?: TrendIndicator | null;
  locale: string;
  labels: KpiTrendLabels;
}) {
  return (
    <Card className="p-5">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums text-foreground">
        {value}
      </p>
      {trend ? <TrendChip trend={trend} locale={locale} labels={labels} /> : null}
    </Card>
  );
}

function TrendChip({
  trend,
  locale,
  labels,
}: {
  trend: TrendIndicator;
  locale: string;
  labels: KpiTrendLabels;
}) {
  if (!trend.comparable || trend.deltaPercent === null) {
    return (
      <p className="mt-2 text-xs text-muted-foreground">{labels.noComparison}</p>
    );
  }

  const percent = Math.abs(Math.round(trend.deltaPercent));
  const Icon =
    trend.direction === "up"
      ? TrendingUp
      : trend.direction === "down"
        ? TrendingDown
        : Minus;
  const tone =
    trend.direction === "up"
      ? "text-emerald-600 dark:text-emerald-400"
      : trend.direction === "down"
        ? "text-destructive"
        : "text-muted-foreground";
  const sign =
    trend.direction === "up" ? "+" : trend.direction === "down" ? "−" : "";

  return (
    <p className={cn("mt-2 flex items-center gap-1 text-xs font-medium", tone)}>
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      <span className="tabular-nums">
        {sign}
        {formatNumber(percent, locale)}%
      </span>
      <span className="font-normal text-muted-foreground">
        {labels.vsComparison}
      </span>
    </p>
  );
}
