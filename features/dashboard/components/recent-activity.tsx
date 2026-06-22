import { getLocale, getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { RecentSessionView } from "@/features/dashboard/types";
import { formatDate, formatNumber, formatPercent } from "@/lib/format";

/**
 * Recent reading sessions as a responsive, accessible list (works at every
 * width without a horizontally-overflowing table). Shows the student name only
 * where relevant (admin/teacher). Empty state when there's no activity yet.
 */
export async function RecentActivity({
  sessions,
  showStudent = false,
}: {
  sessions: RecentSessionView[];
  showStudent?: boolean;
}) {
  const t = await getTranslations("dashboard");
  const locale = await getLocale();

  if (sessions.length === 0) {
    return (
      <EmptyState
        title={t("activity.emptyTitle")}
        description={t("activity.emptyDescription")}
      />
    );
  }

  return (
    <ul className="divide-y divide-border/60">
      {sessions.map((session) => (
        <li
          key={session.id}
          className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {session.passageTitle || "—"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {showStudent && session.studentName
                ? `${session.studentName} · `
                : ""}
              {formatDate(session.at, locale)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {session.wpm !== null ? (
              <Badge variant="secondary">
                {t("units.wpm", { value: formatNumber(session.wpm, locale) })}
              </Badge>
            ) : null}
            {session.accuracy !== null ? (
              <Badge variant="outline">
                {formatPercent(session.accuracy, locale)}
              </Badge>
            ) : null}
            {session.wpm === null && session.accuracy === null ? (
              <span className="text-xs text-muted-foreground">
                {t("activity.notScored")}
              </span>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
