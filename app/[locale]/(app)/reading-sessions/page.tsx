import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { requireRole } from "@/features/auth/guards";
import { ReadingSessionsPage } from "@/features/reading/sessions/components/reading-sessions-page";
import { getReadingSessionsData } from "@/features/reading/sessions/queries";
import type { AppLocale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "readingSessions" });
  return { title: t("title") };
}

/**
 * The student reading workflow + history (student only). The role gate runs here
 * and again when resolving the student's data; loading and error states are
 * handled by the colocated `loading.tsx` / `error.tsx`.
 */
export default async function ReadingSessionsRoute({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await requireRole("student");
  const data = await getReadingSessionsData(user.profile.id);

  return <ReadingSessionsPage data={data} />;
}
