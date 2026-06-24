"use client";

import { Activity, Gauge, History, Target, Trophy } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { KpiCard } from "@/features/dashboard/components/kpi-card";
import { SectionCard } from "@/features/dashboard/components/section-card";
import { Sparkline } from "@/features/dashboard/components/sparkline";
import type { ReadingHistory } from "@/features/reading/sessions/types";
import {
  formatDate,
  formatDuration,
  formatNumber,
  formatPercent,
} from "@/lib/format";

const DASH = "—";

/** A student's progress summary + recent-session list. */
export function ReadingHistoryPanel({ history }: { history: ReadingHistory }) {
  const t = useTranslations("readingSessions.history");
  const locale = useLocale();
  const { summary, sessions } = history;

  if (sessions.length === 0) {
    return (
      <EmptyState
        icon={<History />}
        title={t("empty.title")}
        description={t("empty.description")}
      />
    );
  }

  return (
    <div className="space-y-6">
      <section
        aria-label={t("summaryLabel")}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <KpiCard
          label={t("kpis.sessions")}
          value={formatNumber(summary.sessions, locale)}
          icon={Activity}
        />
        <KpiCard
          label={t("kpis.avgWpm")}
          value={
            summary.avgWpm !== null
              ? formatNumber(Math.round(summary.avgWpm), locale)
              : DASH
          }
          icon={Gauge}
        />
        <KpiCard
          label={t("kpis.bestWpm")}
          value={
            summary.bestWpm !== null
              ? formatNumber(summary.bestWpm, locale)
              : DASH
          }
          icon={Trophy}
        />
        <KpiCard
          label={t("kpis.avgAccuracy")}
          value={
            summary.avgAccuracy !== null
              ? formatPercent(summary.avgAccuracy, locale)
              : DASH
          }
          icon={Target}
        />
      </section>

      {summary.wpmTrend.length >= 2 ? (
        <SectionCard title={t("trendTitle")} description={t("trendDescription")}>
          <Sparkline data={summary.wpmTrend} />
        </SectionCard>
      ) : null}

      <SectionCard title={t("listTitle")}>
        <ul className="divide-y divide-border/60">
          {sessions.map((session) => (
            <li
              key={session.id}
              className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 space-y-0.5">
                <p className="truncate text-sm font-medium text-foreground">
                  {session.passageTitle || DASH}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(session.at, locale)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="tabular-nums">
                  <span className="sr-only">{t("columns.wpm")}: </span>
                  {session.wpm !== null
                    ? t("wpmValue", { value: formatNumber(session.wpm, locale) })
                    : DASH}
                </Badge>
                <Badge variant="outline" className="tabular-nums">
                  <span className="sr-only">{t("columns.accuracy")}: </span>
                  {session.accuracy !== null
                    ? formatPercent(session.accuracy, locale)
                    : DASH}
                </Badge>
                <span
                  dir="ltr"
                  className="text-xs text-muted-foreground tabular-nums"
                >
                  <span className="sr-only">{t("columns.duration")}: </span>
                  {session.durationSeconds !== null
                    ? formatDuration(session.durationSeconds, locale)
                    : DASH}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}
