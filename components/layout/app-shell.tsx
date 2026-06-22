import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { DashboardTopbar } from "@/components/layout/dashboard-topbar";
import { SkipLink } from "@/components/layout/skip-link";
import type { SessionUser } from "@/features/auth/types";

/**
 * The authenticated application shell: persistent sidebar (desktop) + drawer
 * (mobile), a sticky top bar, and the page content region. Built as a Server
 * Component; only the interactive leaves (nav, drawer, menus) are client.
 */
export function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh bg-background">
      <SkipLink />
      <DashboardSidebar role={user.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopbar user={user} />
        <main
          id="main-content"
          className="flex-1 px-4 py-6 sm:px-6 lg:px-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
