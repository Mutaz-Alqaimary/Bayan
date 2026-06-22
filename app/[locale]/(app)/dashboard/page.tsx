import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { requireUser } from "@/features/auth/guards";
import { AdminDashboard } from "@/features/dashboard/components/admin-dashboard";
import { StudentDashboard } from "@/features/dashboard/components/student-dashboard";
import { TeacherDashboard } from "@/features/dashboard/components/teacher-dashboard";
import { getAdminDashboardData } from "@/features/dashboard/data/admin";
import { getStudentDashboardData } from "@/features/dashboard/data/student";
import { getTeacherDashboardData } from "@/features/dashboard/data/teacher";
import type { AppLocale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard" });
  return { title: t("title") };
}

/**
 * Single dashboard route that renders the dashboard for the signed-in user's
 * role. The data is fetched per role in the server-only data layer; loading and
 * error states are handled by the colocated `loading.tsx` / `error.tsx`.
 */
export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await requireUser();

  switch (user.role) {
    case "admin":
      return <AdminDashboard data={await getAdminDashboardData()} />;
    case "teacher":
      return <TeacherDashboard data={await getTeacherDashboardData()} />;
    case "student":
      return (
        <StudentDashboard data={await getStudentDashboardData(user.profile.id)} />
      );
    default: {
      const exhaustive: never = user.role;
      return exhaustive;
    }
  }
}
