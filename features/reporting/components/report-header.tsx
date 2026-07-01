import { BookOpenText } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { formatDate } from "@/lib/format";

import type { ReportMeta } from "../types";

/**
 * The printed document header: the Bayan brand mark, the report title (+ an
 * optional subtitle such as the student's name), and a meta line carrying the
 * range, generation date, and the staff member who prepared it. Rendered inside
 * the document itself (not the on-screen toolbar) so it appears on the PDF —
 * giving a teacher something presentable to hand to a parent or administrator.
 */
export async function ReportHeader({
  title,
  subtitle,
  meta,
}: {
  title: string;
  subtitle?: string;
  meta: ReportMeta;
}) {
  const t = await getTranslations("reports");
  const ta = await getTranslations("analytics");
  const locale = await getLocale();

  return (
    <header className="space-y-4 border-b border-border pb-6">
      <div className="flex items-center gap-2 text-primary">
        <BookOpenText className="size-6 shrink-0" aria-hidden="true" />
        <span className="text-lg font-semibold tracking-tight">
          {t("brand")}
        </span>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle ? (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>

      <dl className="flex flex-wrap gap-x-8 gap-y-1.5 text-sm">
        <div className="flex items-center gap-2">
          <dt className="font-medium text-muted-foreground">{t("range")}</dt>
          <dd className="text-foreground">{ta(`ranges.${meta.range}`)}</dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="font-medium text-muted-foreground">
            {t("generatedLabel")}
          </dt>
          <dd className="text-foreground">
            {formatDate(meta.generatedAt, locale)}
          </dd>
        </div>
        {meta.generatedByName ? (
          <div className="flex items-center gap-2">
            <dt className="font-medium text-muted-foreground">{t("byLabel")}</dt>
            <dd className="text-foreground">{meta.generatedByName}</dd>
          </div>
        ) : null}
      </dl>
    </header>
  );
}
