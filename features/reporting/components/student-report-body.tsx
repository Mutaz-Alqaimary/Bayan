import { getLocale, getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/ui/empty-state";
import { AnalyticsKpi, type KpiTrendLabels } from "@/features/analytics/components/analytics-kpi";
import type { ChartSummaryLabels } from "@/features/analytics/components/charts/chart-summary-row";
import { formatInsightValues } from "@/features/analytics/components/insight-items";
import { InsightsList, type InsightItem } from "@/features/analytics/components/insights-list";
import { TrendChartCard } from "@/features/analytics/components/trend-chart-card";
import { SectionCard } from "@/features/dashboard/components/section-card";
import {
  formatDate,
  formatDuration,
  formatNumber,
  formatPercent,
} from "@/lib/format";

import type { StudentReport } from "../types";
import { ReportHeader } from "./report-header";

const DASH = "—";

/**
 * The single-student progress report (parent-facing). Reuses the exact Phase 13
 * presentation primitives (KPI tiles, trend charts, insights list) over the
 * reused `StudentReadingAnalytics` view model — no aggregation, no charts, and no
 * insight logic are re-implemented here. It differs from the interactive
 * analytics view only in being a self-contained document: a printed header and no
 * navigation chrome. The two empty states are inherited from analytics.
 */
export async function StudentReportBody({ report }: { report: StudentReport }) {
  const t = await getTranslations("reports");
  const ta = await getTranslations("analytics");
  const locale = await getLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";

  const data = report.analytics;
  const subtitle = `${data.student.name} · ${t("grade")} ${formatNumber(
    data.student.grade,
    locale,
  )}`;

  const header = (
    <ReportHeader title={t("studentTitle")} subtitle={subtitle} meta={report.meta} />
  );

  if (data.availability === "empty_all") {
    return (
      <div className="space-y-6">
        {header}
        <EmptyState
          title={t("studentEmpty.allTitle")}
          description={t("studentEmpty.allDescription")}
        />
      </div>
    );
  }
  if (data.availability === "empty_range") {
    return (
      <div className="space-y-6">
        {header}
        <EmptyState
          title={t("empty.rangeTitle")}
          description={t("empty.rangeDescription")}
        />
      </div>
    );
  }

  const num = (value: number) => formatNumber(value, locale);
  const pct = (value: number) => formatPercent(value, locale);
  const dur = (value: number) => formatDuration(value, locale);
  const wpmValue = (value: number | null) =>
    value !== null ? `${num(value)} ${ta("units.wpmSuffix")}` : DASH;

  const trendLabels: KpiTrendLabels = {
    vsComparison: ta("trend.vsComparison"),
    noComparison: ta("trend.noComparison"),
  };
  const summaryLabels: ChartSummaryLabels = {
    current: ta("summary.current"),
    previous: ta("summary.previous"),
    change: ta("summary.change"),
    highest: ta("summary.highest"),
    lowest: ta("summary.lowest"),
  };

  const insightItems: InsightItem[] = data.insights.map((insight) => ({
    id: insight.id,
    severity: insight.severity,
    text: ta(`insights.kinds.${insight.kind}`, formatInsightValues(insight, num)),
  }));

  return (
    <div className="space-y-6">
      {header}

      <section
        aria-label={ta("kpis.label")}
        className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6"
      >
        <AnalyticsKpi
          label={ta("kpis.avgWpm")}
          value={wpmValue(data.kpis.avgWpm.current)}
          trend={data.kpis.avgWpm}
          locale={locale}
          labels={trendLabels}
        />
        <AnalyticsKpi
          label={ta("kpis.avgAccuracy")}
          value={
            data.kpis.avgAccuracy.current !== null
              ? pct(data.kpis.avgAccuracy.current)
              : DASH
          }
          trend={data.kpis.avgAccuracy}
          locale={locale}
          labels={trendLabels}
        />
        <AnalyticsKpi
          label={ta("kpis.bestWpm")}
          value={wpmValue(data.kpis.bestWpm)}
          locale={locale}
          labels={trendLabels}
        />
        <AnalyticsKpi
          label={ta("kpis.sessions")}
          value={num(data.kpis.sessions)}
          locale={locale}
          labels={trendLabels}
        />
        <AnalyticsKpi
          label={ta("kpis.passagesRead")}
          value={num(data.kpis.passagesRead)}
          locale={locale}
          labels={trendLabels}
        />
        <AnalyticsKpi
          label={ta("kpis.vocabularyExposed")}
          value={num(data.kpis.vocabularyExposed)}
          locale={locale}
          labels={trendLabels}
        />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TrendChartCard
          title={ta("charts.wpmTitle")}
          description={ta("charts.wpmDescription")}
          series={data.wpm}
          variant="line"
          dir={dir}
          formatValue={num}
          chartLabels={{
            caption: ta("charts.wpmTitle"),
            period: ta("table.period"),
            value: ta("table.wpm"),
          }}
          summaryLabels={summaryLabels}
        />
        <TrendChartCard
          title={ta("charts.accuracyTitle")}
          description={ta("charts.accuracyDescription")}
          series={data.accuracy}
          variant="line"
          dir={dir}
          formatValue={pct}
          chartLabels={{
            caption: ta("charts.accuracyTitle"),
            period: ta("table.period"),
            value: ta("table.accuracy"),
          }}
          summaryLabels={summaryLabels}
        />
      </div>

      <TrendChartCard
        title={ta("charts.durationTitle")}
        description={ta("charts.durationDescription")}
        series={data.duration}
        variant="line"
        dir={dir}
        formatValue={dur}
        chartLabels={{
          caption: ta("charts.durationTitle"),
          period: ta("table.period"),
          value: ta("table.duration"),
        }}
        summaryLabels={summaryLabels}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title={ta("insights.title")}>
          <InsightsList items={insightItems} emptyText={ta("insights.empty")} />
        </SectionCard>
        <SectionCard title={ta("recent.title")}>
          {data.recentSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">{ta("recent.empty")}</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {data.recentSessions.map((session) => (
                <li
                  key={session.id}
                  className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {session.passageTitle}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(session.at, locale)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-sm tabular-nums">
                    <span className="text-foreground">
                      {session.wpm !== null ? wpmValue(session.wpm) : DASH}
                    </span>
                    <span className="text-muted-foreground">
                      {session.accuracy !== null
                        ? formatPercent(session.accuracy, locale)
                        : DASH}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
