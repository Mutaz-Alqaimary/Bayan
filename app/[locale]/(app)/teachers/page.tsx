import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { requireRole } from "@/features/auth/guards";
import { TeachersPage } from "@/features/teachers/components/teachers-page";
import { getPromotableUsers, getTeachers } from "@/features/teachers/queries";
import type { AppLocale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "teachers" });
  return { title: t("title") };
}

/**
 * Teacher Management (admin only). The role gate runs here and again inside the
 * queries (defense in depth at the data layer). A teacher is exactly a
 * `profiles.role='teacher'` projection — no `teachers` table. Loading and error
 * states are handled by the colocated `loading.tsx` / `error.tsx`.
 */
export default async function TeachersRoute({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  await requireRole("admin");
  const [teachers, candidates] = await Promise.all([
    getTeachers(),
    getPromotableUsers(),
  ]);

  return <TeachersPage teachers={teachers} candidates={candidates} />;
}
