import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import type { SessionUser } from "@/features/auth/types";

/**
 * Authenticated top bar: the mobile menu trigger on the inline-start, and the
 * locale, theme, and account controls on the inline-end (mirrors in RTL via
 * `ms-auto` and logical padding).
 */
export function DashboardTopbar({ user }: { user: SessionUser }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/80 bg-background/80 px-4 backdrop-blur supports-backdrop-filter:bg-background/60 sm:px-6">
      <MobileNav role={user.role} />
      <div className="ms-auto flex items-center gap-2">
        <LocaleSwitcher />
        <ThemeToggle />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
