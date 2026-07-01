import { Activity, BookOpen, Gauge, Languages } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/ui/empty-state";
import { KpiCard } from "@/features/dashboard/components/kpi-card";
import { ProgressRing } from "@/features/dashboard/components/progress-ring";
import {
  QuickActions,
  type QuickAction,
} from "@/features/dashboard/components/quick-actions";
import { RecentActivity } from "@/features/dashboard/components/recent-activity";
import { SectionCard } from "@/features/dashboard/components/section-card";
import { Sparkline } from "@/features/dashboard/components/sparkline";
import { StatTile } from "@/features/dashboard/components/stat-tile";
import type { StudentDashboardData } from "@/features/dashboard/types";
import { formatNumber, formatPercent } from "@/lib/format";
import { isRouteImplemented, ROUTES } from "@/lib/routes";

const DASH = "—";

/** Personal progress — answers "am I getting better at reading?". */
export async function StudentDashboard({
  data,
}: {
  data: StudentDashboardData;
}) {
  const t = await getTranslations("dashboard");
  const tNav = await getTranslations("nav");
  const locale = await getLocale();

  // A self-registered student whose reading profile hasn't been set up yet.
  if (!data.linked) {
    return (
      <div className="space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("student.unlinkedHeading")}
          </h1>
        </header>
        <EmptyState
          icon={<BookOpen />}
          title={t("student.unlinkedTitle")}
          description={t("student.unlinkedDescription")}
        />
      </div>
    );
  }

  const quickActions: QuickAction[] = [
    {
      key: "startReading",
      label: t("quickActions.startReading"),
      icon: BookOpen,
      href: ROUTES.readingSessions,
      implemented: isRouteImplemented(ROUTES.readingSessions),
    },
  ];

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t("student.title", { name: data.studentName })}
        </h1>
        <p className="text-muted-foreground">
          {t("student.subtitle", { grade: formatNumber(data.grade, locale) })}
        </p>
      </header>

      <section
        aria-label={t("kpis.label")}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <KpiCard
          label={t("student.kpis.sessions")}
          value={formatNumber(data.totals.sessionsCompleted, locale)}
          icon={Activity}
        />
        <KpiCard
          label={t("student.kpis.passages")}
          value={formatNumber(data.totals.passagesRead, locale)}
          icon={BookOpen}
        />
        <KpiCard
          label={t("student.kpis.vocabulary")}
          value={formatNumber(data.totals.vocabularyExposed, locale)}
          icon={Languages}
        />
        <KpiCard
          label={t("student.kpis.bestWpm")}
          value={
            data.progress.bestWpm !== null
              ? formatNumber(data.progress.bestWpm, locale)
              : DASH
          }
          icon={Gauge}
        />
      </section>

      <SectionCard title={t("student.progressTitle")}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatTile
            label={t("metrics.avgWpm")}
            value={
              data.progress.avgWpm !== null
                ? t("units.wpm", {
                    value: formatNumber(data.progress.avgWpm, locale),
                  })
                : DASH
            }
          >
            <Sparkline data={data.wpmTrend} />
          </StatTile>
          <StatTile
            label={t("metrics.avgAccuracy")}
            value={
              data.progress.avgAccuracy !== null
                ? formatPercent(data.progress.avgAccuracy, locale)
                : DASH
            }
          />
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-border/60 bg-card p-4 text-center">
            <ProgressRing
              value={data.weeklyActivity.completed}
              max={data.weeklyActivity.target}
              label={t("student.weeklyAria", {
                completed: formatNumber(data.weeklyActivity.completed, locale),
                target: formatNumber(data.weeklyActivity.target, locale),
              })}
            />
            <p className="text-sm font-medium text-muted-foreground">
              {t("student.weeklyLabel")}
            </p>
          </div>
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SectionCard title={t("student.historyTitle")} className="lg:col-span-2">
          <RecentActivity sessions={data.recentSessions} />
        </SectionCard>
        <SectionCard title={t("quickActions.title")}>
          <QuickActions
            actions={quickActions}
            comingSoonLabel={tNav("comingSoon")}
          />
        </SectionCard>
      </div>
    </div>
  );
}
