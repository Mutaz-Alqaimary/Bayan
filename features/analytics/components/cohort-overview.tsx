import { getLocale, getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/ui/empty-state";
import type { CohortReadingAnalytics } from "@/features/analytics/reading/types";
import type { TimeRange } from "@/features/analytics/time-range";
import { SectionCard } from "@/features/dashboard/components/section-card";
import { formatNumber, formatPercent } from "@/lib/format";

import { AnalyticsKpi, type KpiTrendLabels } from "./analytics-kpi";
import type { ChartSummaryLabels } from "./charts/chart-summary-row";
import { StudentCards } from "./student-cards";
import type { StudentCardLabels } from "./student-metric-card";
import { StudentPicker } from "./student-picker";
import { TrendChartCard } from "./trend-chart-card";

const DASH = "—";

/**
 * Cohort (admin/teacher) overview: KPIs with trend, the WPM/accuracy/activity
 * charts, the "needs attention" rail, and the student grid with a secondary
 * picker. Distinguishes the two empty states (spec §11a.4).
 */
export async function CohortOverview({
  data,
  range,
}: {
  data: CohortReadingAnalytics;
  range: TimeRange;
}) {
  const t = await getTranslations("analytics");
  const locale = await getLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";

  if (data.availability === "empty_all") {
    return (
      <EmptyState
        title={t("empty.allTitle")}
        description={t("empty.allDescription")}
      />
    );
  }
  if (data.availability === "empty_range") {
    return (
      <EmptyState
        title={t("empty.rangeTitle")}
        description={t("empty.rangeDescription")}
      />
    );
  }

  const num = (value: number) => formatNumber(value, locale);
  const pct = (value: number) => formatPercent(value, locale);
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
  const cardLabels: StudentCardLabels = {
    grade: t("card.grade"),
    speed: t("card.speed"),
    accuracy: t("card.accuracy"),
    sessions: t("card.sessions"),
    atRisk: t("card.atRisk"),
  };

  const pickerStudents = data.students.map((student) => ({
    id: student.id,
    name: student.name,
  }));

  return (
    <div className="space-y-6">
      <section
        aria-label={t("kpis.label")}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
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
          label={t("kpis.activeReaders")}
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
          label={t("kpis.sessions")}
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
        title={t("charts.activityTitle")}
        description={t("charts.activityDescription")}
        series={data.activity}
        variant="bar"
        dir={dir}
        formatValue={num}
        chartLabels={{
          caption: t("charts.activityTitle"),
          period: t("table.period"),
          value: t("table.sessions"),
        }}
        summaryLabels={summaryLabels}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SectionCard
          title={t("needsAttention.title")}
          description={t("needsAttention.description")}
          className="lg:col-span-1"
        >
          <StudentCards
            students={data.needsAttention}
            range={range}
            locale={locale}
            labels={cardLabels}
            emptyTitle={t("needsAttention.emptyTitle")}
            emptyDescription={t("needsAttention.emptyDescription")}
            single
          />
        </SectionCard>
        <SectionCard
          title={t("students.title")}
          description={t("students.description")}
          action={
            <div className="w-full sm:w-64">
              <StudentPicker
                students={pickerStudents}
                range={range}
                label={t("students.searchLabel")}
                placeholder={t("students.searchPlaceholder")}
                emptyText={t("students.searchEmpty")}
              />
            </div>
          }
          className="lg:col-span-2"
        >
          <StudentCards
            students={data.students}
            range={range}
            locale={locale}
            labels={cardLabels}
            emptyTitle={t("students.emptyTitle")}
            emptyDescription={t("students.emptyDescription")}
          />
        </SectionCard>
      </div>
    </div>
  );
}
