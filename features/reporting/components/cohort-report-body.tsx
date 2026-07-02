import { AlertTriangle } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/ui/empty-state";
import { AnalyticsKpi, type KpiTrendLabels } from "@/features/analytics/components/analytics-kpi";
import type { ChartSummaryLabels } from "@/features/analytics/components/charts/chart-summary-row";
import { TrendChartCard } from "@/features/analytics/components/trend-chart-card";
import { SectionCard } from "@/features/dashboard/components/section-card";
import { formatNumber, formatPercent } from "@/lib/format";

import type { CohortReport } from "../types";
import { ReportHeader } from "./report-header";

const DASH = "—";

/**
 * The program/cohort report (administrator-facing). Reuses the Phase 13 KPI and
 * trend-chart primitives over the reused `CohortReadingAnalytics` view model, and
 * renders the roster as a print-friendly summary **table** (rather than the
 * interactive linked cards of the analytics view) with an at-risk status column.
 * The status uses icon + text — never colour alone — so it survives a black-and-
 * white printout (Phase 15). No aggregation or chart logic is re-implemented.
 */
export async function CohortReportBody({ report }: { report: CohortReport }) {
  const t = await getTranslations("reports");
  const ta = await getTranslations("analytics");
  const locale = await getLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";

  const data = report.analytics;
  const header = <ReportHeader title={t("cohortTitle")} meta={report.meta} />;

  if (data.availability === "empty_all") {
    return (
      <div className="space-y-6">
        {header}
        <EmptyState
          title={t("empty.allTitle")}
          description={t("empty.allDescription")}
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

  return (
    <div className="space-y-6">
      {header}

      <section
        aria-label={ta("kpis.label")}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
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
          label={ta("kpis.activeReaders")}
          value={
            data.kpis.activeReaders.current !== null
              ? num(data.kpis.activeReaders.current)
              : DASH
          }
          trend={data.kpis.activeReaders}
          locale={locale}
          labels={trendLabels}
        />
        <AnalyticsKpi
          label={ta("kpis.sessions")}
          value={
            data.kpis.sessions.current !== null
              ? num(data.kpis.sessions.current)
              : DASH
          }
          trend={data.kpis.sessions}
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
        title={ta("charts.activityTitle")}
        description={ta("charts.activityDescription")}
        series={data.activity}
        variant="bar"
        dir={dir}
        formatValue={num}
        chartLabels={{
          caption: ta("charts.activityTitle"),
          period: ta("table.period"),
          value: ta("table.sessions"),
        }}
        summaryLabels={summaryLabels}
      />

      <SectionCard
        title={t("roster.title")}
        description={t("roster.description")}
      >
        {data.students.length === 0 ? (
          <EmptyState
            title={ta("students.emptyTitle")}
            description={ta("students.emptyDescription")}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-xl border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-start text-xs font-medium text-muted-foreground">
                  <th scope="col" className="py-2 pe-4 text-start font-medium">
                    {t("roster.name")}
                  </th>
                  <th scope="col" className="py-2 pe-4 text-start font-medium">
                    {t("grade")}
                  </th>
                  <th scope="col" className="py-2 pe-4 text-end font-medium">
                    {ta("card.speed")}
                  </th>
                  <th scope="col" className="py-2 pe-4 text-end font-medium">
                    {ta("card.accuracy")}
                  </th>
                  <th scope="col" className="py-2 pe-4 text-end font-medium">
                    {ta("kpis.sessions")}
                  </th>
                  <th scope="col" className="py-2 text-start font-medium">
                    {t("roster.status")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.students.map((student) => (
                  <tr
                    key={student.id}
                    className="border-b border-border/60 last:border-0"
                  >
                    <th
                      scope="row"
                      className="max-w-48 truncate py-2.5 pe-4 text-start font-medium text-foreground"
                    >
                      {student.name}
                    </th>
                    <td className="py-2.5 pe-4 tabular-nums text-foreground">
                      {num(student.grade)}
                    </td>
                    <td className="py-2.5 pe-4 text-end tabular-nums text-foreground">
                      {wpmValue(student.avgWpm)}
                    </td>
                    <td className="py-2.5 pe-4 text-end tabular-nums text-foreground">
                      {student.avgAccuracy !== null
                        ? pct(student.avgAccuracy)
                        : DASH}
                    </td>
                    <td className="py-2.5 pe-4 text-end tabular-nums text-foreground">
                      {num(student.sessionsCount)}
                    </td>
                    <td className="py-2.5">
                      {student.atRisk ? (
                        <span className="inline-flex items-center gap-1.5 text-destructive-text">
                          <AlertTriangle
                            className="size-3.5 shrink-0"
                            aria-hidden="true"
                          />
                          {ta("card.atRisk")}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          {t("roster.onTrack")}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
