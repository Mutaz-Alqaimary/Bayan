import { ArrowLeft } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/ui/empty-state";
import type { StudentReadingAnalytics } from "@/features/analytics/reading/types";
import {
  ANALYTICS_RANGE_PARAM,
} from "@/features/analytics/search-params";
import type { TimeRange } from "@/features/analytics/time-range";
import { SectionCard } from "@/features/dashboard/components/section-card";
import { Link } from "@/i18n/navigation";
import {
  formatDate,
  formatDuration,
  formatNumber,
  formatPercent,
} from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

import { AnalyticsKpi, type KpiTrendLabels } from "./analytics-kpi";
import type { ChartSummaryLabels } from "./charts/chart-summary-row";
import { InsightsList, type InsightItem } from "./insights-list";
import { TrendChartCard } from "./trend-chart-card";

const DASH = "—";

/**
 * Per-student drill-down: KPIs (speed/accuracy with trend; counts plain), the
 * WPM/accuracy/duration charts, plain-language insights, and recent sessions.
 * Resolved by `students.id`; same two-empty-state distinction (spec §11a.4).
 */
export async function StudentAnalytics({
  data,
  range,
}: {
  data: StudentReadingAnalytics;
  range: TimeRange;
}) {
  const t = await getTranslations("analytics");
  const locale = await getLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";

  const header = (
    <header className="space-y-3">
      <Link
        href={{
          pathname: ROUTES.analytics,
          query: { [ANALYTICS_RANGE_PARAM]: range },
        }}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft
          className={cn("size-4", dir === "rtl" && "rotate-180")}
          aria-hidden="true"
        />
        {t("backToOverview")}
      </Link>
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          {data.student.name}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("card.grade")} {formatNumber(data.student.grade, locale)}
        </p>
      </div>
    </header>
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
    value !== null ? `${num(value)} ${t("units.wpmSuffix")}` : DASH;

  const trendLabels: KpiTrendLabels = {
    vsComparison: t("trend.vsComparison"),
    noComparison: t("trend.noComparison"),
  };
  const summaryLabels: ChartSummaryLabels = {
    current: t("summary.current"),
    previous: t("summary.previous"),
    change: t("summary.change"),
    highest: t("summary.highest"),
    lowest: t("summary.lowest"),
  };

  // Pre-format numeric insight values so interpolation keeps Western numerals
  // (next-intl would otherwise localize numbers to Eastern Arabic in `ar`).
  const insightItems: InsightItem[] = data.insights.map((insight) => {
    const values = Object.fromEntries(
      Object.entries(insight.values).map(([key, value]) => [
        key,
        typeof value === "number" ? num(value) : value,
      ]),
    );
    return {
      id: insight.id,
      severity: insight.severity,
      text: t(`insights.kinds.${insight.kind}`, values),
    };
  });

  return (
    <div className="space-y-6">
      {header}

      <section
        aria-label={t("kpis.label")}
        className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6"
      >
        <AnalyticsKpi
          label={t("kpis.avgWpm")}
          value={wpmValue(data.kpis.avgWpm.current)}
          trend={data.kpis.avgWpm}
          locale={locale}
          labels={trendLabels}
        />
        <AnalyticsKpi
          label={t("kpis.avgAccuracy")}
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
          label={t("kpis.bestWpm")}
          value={wpmValue(data.kpis.bestWpm)}
          locale={locale}
          labels={trendLabels}
        />
        <AnalyticsKpi
          label={t("kpis.sessions")}
          value={num(data.kpis.sessions)}
          locale={locale}
          labels={trendLabels}
        />
        <AnalyticsKpi
          label={t("kpis.passagesRead")}
          value={num(data.kpis.passagesRead)}
          locale={locale}
          labels={trendLabels}
        />
        <AnalyticsKpi
          label={t("kpis.vocabularyExposed")}
          value={num(data.kpis.vocabularyExposed)}
          locale={locale}
          labels={trendLabels}
        />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TrendChartCard
          title={t("charts.wpmTitle")}
          description={t("charts.wpmDescription")}
          series={data.wpm}
          variant="line"
          dir={dir}
          formatValue={num}
          chartLabels={{
            caption: t("charts.wpmTitle"),
            period: t("table.period"),
            value: t("table.wpm"),
          }}
          summaryLabels={summaryLabels}
        />
        <TrendChartCard
          title={t("charts.accuracyTitle")}
          description={t("charts.accuracyDescription")}
          series={data.accuracy}
          variant="line"
          dir={dir}
          formatValue={pct}
          chartLabels={{
            caption: t("charts.accuracyTitle"),
            period: t("table.period"),
            value: t("table.accuracy"),
          }}
          summaryLabels={summaryLabels}
        />
      </div>

      <TrendChartCard
        title={t("charts.durationTitle")}
        description={t("charts.durationDescription")}
        series={data.duration}
        variant="line"
        dir={dir}
        formatValue={dur}
        chartLabels={{
          caption: t("charts.durationTitle"),
          period: t("table.period"),
          value: t("table.duration"),
        }}
        summaryLabels={summaryLabels}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title={t("insights.title")}>
          <InsightsList items={insightItems} emptyText={t("insights.empty")} />
        </SectionCard>
        <SectionCard title={t("recent.title")}>
          {data.recentSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("recent.empty")}</p>
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
