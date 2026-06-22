import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { requireRole } from "@/features/auth/guards";
import { StudentsPage } from "@/features/students/components/students-page";
import { getStudents } from "@/features/students/queries";
import type { AppLocale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "students" });
  return { title: t("title") };
}

/**
 * Students roster (admin & teacher only). The role gate runs both here and again
 * inside `getStudents()` (defense in depth at the data layer). Loading and error
 * states are handled by the colocated `loading.tsx` / `error.tsx`.
 */
export default async function StudentsRoute({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  await requireRole("admin", "teacher");
  const students = await getStudents();

  return <StudentsPage students={students} />;
}
