import { SectionCard } from "@/features/dashboard/components/section-card";
import type { AnalyticsTrendSeries } from "@/features/analytics/types";

import { BarSeries } from "./charts/bar-series";
import type { ChartLabels } from "./charts/chart-frame";
import {
  ChartSummaryRow,
  type ChartSummaryLabels,
} from "./charts/chart-summary-row";
import { LineTrend } from "./charts/line-trend";

/**
 * A titled card pairing a trend chart with its no-hover summary (spec §11a.2) —
 * the reusable unit behind every cohort/student chart. Presentation-only: it
 * forwards an already-prepared `AnalyticsTrendSeries` to the chart kit; all
 * formatting and labels arrive resolved from the parent.
 */
export function TrendChartCard({
  title,
  description,
  series,
  variant,
  dir,
  formatValue,
  chartLabels,
  summaryLabels,
}: {
  title: string;
  description?: string;
  series: AnalyticsTrendSeries;
  variant: "line" | "bar";
  dir: "rtl" | "ltr";
  formatValue: (value: number) => string;
  chartLabels: ChartLabels;
  summaryLabels: ChartSummaryLabels;
}) {
  return (
    <SectionCard title={title} description={description}>
      <div className="space-y-4">
        {variant === "line" ? (
          <LineTrend
            series={series}
            dir={dir}
            formatValue={formatValue}
            labels={chartLabels}
            title={title}
            description={description}
          />
        ) : (
          <BarSeries
            series={series}
            dir={dir}
            formatValue={formatValue}
            labels={chartLabels}
            title={title}
            description={description}
          />
        )}
        <ChartSummaryRow
          summary={series.summary}
          formatValue={formatValue}
          labels={summaryLabels}
        />
      </div>
    </SectionCard>
  );
}
