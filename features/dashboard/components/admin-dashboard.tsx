import {
  Activity,
  BarChart3,
  BookOpenText,
  FileText,
  GraduationCap,
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
import type { AdminDashboardData } from "@/features/dashboard/types";
import { formatNumber, formatPercent } from "@/lib/format";
import { isRouteImplemented, ROUTES } from "@/lib/routes";

const DASH = "—";

/** Platform health overview — answers "is the platform healthy and growing?". */
export async function AdminDashboard({ data }: { data: AdminDashboardData }) {
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
      key: "addPassage",
      label: t("quickActions.addPassage"),
      icon: BookOpenText,
      href: ROUTES.passages,
      implemented: isRouteImplemented(ROUTES.passages),
    },
    {
      key: "viewAnalytics",
      label: t("quickActions.viewAnalytics"),
      icon: BarChart3,
      href: ROUTES.analytics,
      implemented: isRouteImplemented(ROUTES.analytics),
    },
    {
      key: "viewReports",
      label: t("quickActions.viewReports"),
      icon: FileText,
      href: ROUTES.reports,
      implemented: isRouteImplemented(ROUTES.reports),
    },
  ];

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t("admin.title")}
        </h1>
        <p className="text-muted-foreground">{t("admin.subtitle")}</p>
      </header>

      <section
        aria-label={t("kpis.label")}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <KpiCard
          label={t("admin.kpis.students")}
          value={formatNumber(data.totals.students, locale)}
          icon={Users}
        />
        <KpiCard
          label={t("admin.kpis.teachers")}
          value={formatNumber(data.totals.teachers, locale)}
          icon={GraduationCap}
        />
        <KpiCard
          label={t("admin.kpis.passages")}
          value={formatNumber(data.totals.passages, locale)}
          icon={BookOpenText}
        />
        <KpiCard
          label={t("admin.kpis.sessions")}
          value={formatNumber(data.totals.sessions, locale)}
          icon={Activity}
        />
      </section>

      <SectionCard title={t("metrics.title")} description={t("metrics.description")}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatTile
            label={t("metrics.avgWpm")}
            value={
              data.platform.avgWpm !== null
                ? t("units.wpm", {
                    value: formatNumber(data.platform.avgWpm, locale),
                  })
                : DASH
            }
          />
          <StatTile
            label={t("metrics.avgAccuracy")}
            value={
              data.platform.avgAccuracy !== null
                ? formatPercent(data.platform.avgAccuracy, locale)
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SectionCard title={t("activity.title")} className="lg:col-span-2">
          <RecentActivity sessions={data.recentSessions} showStudent />
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
