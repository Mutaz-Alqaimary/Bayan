import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { parseAnalyticsSearchParams } from "@/features/analytics/search-params";
import { requireRole } from "@/features/auth/guards";
import { ReportPage } from "@/features/reporting/components/report-page";
import { getCohortReport, getStudentReport } from "@/features/reporting/queries";
import type { AppLocale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "reports" });
  return { title: t("title") };
}

/**
 * Reporting (admin + teacher). The role gate runs here and again inside the
 * report queries (defense in depth, on top of Phase 17 RLS). Range + drilled-in
 * student come from the URL via the shared analytics param contract, so the read
 * is server-resolved and shareable. An unknown `?student=` id renders a 404.
 * Loading/error live in the colocated `loading.tsx` / `error.tsx`.
 */
export default async function ReportsRoute({
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
    const report = await getStudentReport(studentId, range);
    if (!report) notFound();
    return <ReportPage report={report} range={range} studentId={studentId} />;
  }

  const report = await getCohortReport(range);
  return <ReportPage report={report} range={range} studentId={null} />;
}
