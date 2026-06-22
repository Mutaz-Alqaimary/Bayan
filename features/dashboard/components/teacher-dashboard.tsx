import {
  Activity,
  BarChart3,
  BookOpenText,
  Languages,
  Users,
} from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { KpiCard } from "@/features/dashboard/components/kpi-card";
import { MiniBars } from "@/features/dashboard/components/mini-bars";
import {
  QuickActions,
  type QuickAction,
} from "@/features/dashboard/components/quick-actions";
import { RecentActivity } from "@/features/dashboard/components/recent-activity";
import { SectionCard } from "@/features/dashboard/components/section-card";
import { StatTile } from "@/features/dashboard/components/stat-tile";
import { StudentInsights } from "@/features/dashboard/components/student-insights";
import type { TeacherDashboardData } from "@/features/dashboard/types";
import { formatNumber, formatPercent } from "@/lib/format";
import { isRouteImplemented, ROUTES } from "@/lib/routes";

const DASH = "—";

/** Class overview — answers "which of my students is improving / struggling?". */
export async function TeacherDashboard({
  data,
}: {
  data: TeacherDashboardData;
}) {
  const t = await getTranslations("dashboard");
  const tNav = await getTranslations("nav");
  const locale = await getLocale();

  const sessionsLast7 = data.sessionsTrend.reduce((sum, n) => sum + n, 0);

  const quickActions: QuickAction[] = [
    {
      key: "addStudent",
      label: t("quickActions.addStudent"),
      icon: Users,
      href: ROUTES.students,
      implemented: isRouteImplemented(ROUTES.students),
    },
    {
      key: "createPassage",
      label: t("quickActions.createPassage"),
      icon: BookOpenText,
      href: ROUTES.passages,
      implemented: isRouteImplemented(ROUTES.passages),
    },
    {
      key: "addVocabulary",
      label: t("quickActions.addVocabulary"),
      icon: Languages,
      href: ROUTES.vocabulary,
      implemented: isRouteImplemented(ROUTES.vocabulary),
    },
    {
      key: "viewAnalytics",
      label: t("quickActions.viewAnalytics"),
      icon: BarChart3,
      href: ROUTES.analytics,
      implemented: isRouteImplemented(ROUTES.analytics),
    },
  ];

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t("teacher.title")}
        </h1>
        <p className="text-muted-foreground">{t("teacher.subtitle")}</p>
      </header>

      <section
        aria-label={t("kpis.label")}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <KpiCard
          label={t("teacher.kpis.students")}
          value={formatNumber(data.totals.students, locale)}
          icon={Users}
        />
        <KpiCard
          label={t("teacher.kpis.sessions")}
          value={formatNumber(data.totals.sessions, locale)}
          icon={Activity}
        />
        <KpiCard
          label={t("teacher.kpis.passages")}
          value={formatNumber(data.totals.passages, locale)}
          icon={BookOpenText}
        />
        <KpiCard
          label={t("teacher.kpis.vocabulary")}
          value={formatNumber(data.totals.vocabulary, locale)}
          icon={Languages}
        />
      </section>

      <SectionCard title={t("metrics.title")} description={t("metrics.description")}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatTile
            label={t("metrics.avgWpm")}
            value={
              data.performance.avgWpm !== null
                ? t("units.wpm", {
                    value: formatNumber(data.performance.avgWpm, locale),
                  })
                : DASH
            }
          />
          <StatTile
            label={t("metrics.avgAccuracy")}
            value={
              data.performance.avgAccuracy !== null
                ? formatPercent(data.performance.avgAccuracy, locale)
                : DASH
            }
          />
          <StatTile
            label={t("metrics.sessionsLast7")}
            value={formatNumber(sessionsLast7, locale)}
          >
            <MiniBars data={data.sessionsTrend} />
          </StatTile>
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard
          title={t("insights.title")}
          description={t("insights.description")}
        >
          <StudentInsights students={data.strugglingReaders} />
        </SectionCard>
        <SectionCard title={t("activity.title")}>
          <RecentActivity sessions={data.recentSessions} showStudent />
        </SectionCard>
      </div>

      <SectionCard title={t("quickActions.title")}>
        <QuickActions
          actions={quickActions}
          comingSoonLabel={tNav("comingSoon")}
        />
      </SectionCard>
    </div>
  );
}
