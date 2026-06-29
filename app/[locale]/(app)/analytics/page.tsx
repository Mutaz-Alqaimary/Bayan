import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import {
  getCohortReadingAnalytics,
  getStudentReadingAnalytics,
} from "@/features/analytics/reading/queries";
import { parseAnalyticsSearchParams } from "@/features/analytics/search-params";
import { AnalyticsPage } from "@/features/analytics/components/analytics-page";
import { requireRole } from "@/features/auth/guards";
import type { AppLocale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "analytics" });
  return { title: t("title") };
}

/**
 * Reading Analytics (admin + teacher). The role gate runs here and again inside
 * the queries (defense in depth). Range + drilled-in student come from the URL
 * (`parseAnalyticsSearchParams`), so the read is server-resolved and
 * deterministic. An unknown `?student=` id renders a 404. Loading/error live in
 * the colocated `loading.tsx` / `error.tsx`.
 */
export default async function AnalyticsRoute({
  params,
  searchParams,
}: {
  params: Promise<{ locale: AppLocale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  await requireRole("admin", "teacher");

  const { range, studentId } = parseAnalyticsSearchParams(await searchParams);

  if (studentId) {
    const data = await getStudentReadingAnalytics(studentId, range);
    if (!data) notFound();
    return (
      <AnalyticsPage
        view={{ kind: "student", data }}
        range={range}
        studentId={studentId}
      />
    );
  }

  const data = await getCohortReadingAnalytics(range);
  return (
    <AnalyticsPage view={{ kind: "cohort", data }} range={range} studentId={null} />
  );
}
