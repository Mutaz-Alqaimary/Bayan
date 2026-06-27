import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { requireRole } from "@/features/auth/guards";
import { StudentsPage } from "@/features/students/components/students-page";
import { getStudentAccountStatusMap } from "@/features/students/identity/queries";
import { getStudents } from "@/features/students/queries";
import { getTeacherProfileIds } from "@/features/teachers/queries";
import type { AppLocale } from "@/i18n/routing";
import { supabaseAdminClient } from "@/lib/supabase/admin";

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

  const user = await requireRole("admin", "teacher");
  const [students, teacherProfileIds] = await Promise.all([
    getStudents(),
    getTeacherProfileIds(),
  ]);

  // Derive each roster row's account status (roster-only / invited / active) via
  // the service-role client. Resolution is by profile_id, never by email.
  const statusMap = await getStudentAccountStatusMap(
    supabaseAdminClient(),
    students,
  );
  const statuses = Object.fromEntries(statusMap);

  return (
    <StudentsPage
      students={students}
      statuses={statuses}
      teacherProfileIds={teacherProfileIds}
      canReconcile={user.role === "admin"}
    />
  );
}
