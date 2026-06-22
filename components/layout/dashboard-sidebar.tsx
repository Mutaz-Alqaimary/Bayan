import { getTranslations } from "next-intl/server";

import { BrandMark } from "@/components/layout/brand-mark";
import { DashboardNav } from "@/components/layout/dashboard-nav";
import type { UserRole } from "@/features/auth/types";

/**
 * Desktop sidebar (hidden below `lg`, where the mobile drawer takes over).
 * Uses the dedicated `--sidebar-*` tokens and `border-e` so it mirrors to the
 * inline-start edge in both LTR and RTL.
 */
export async function DashboardSidebar({ role }: { role: UserRole }) {
  const t = await getTranslations("nav");

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-e border-sidebar-border bg-sidebar lg:flex">
      <div className="flex h-16 shrink-0 items-center px-6">
        <BrandMark />
      </div>
      <nav
        aria-label={t("primary")}
        className="flex-1 overflow-y-auto px-4 pb-6"
      >
        <DashboardNav role={role} />
      </nav>
    </aside>
  );
}
