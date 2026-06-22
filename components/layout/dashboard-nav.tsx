"use client";

import { useTranslations } from "next-intl";

import { navItemsForRole } from "@/components/layout/dashboard-nav-items";
import { Badge } from "@/components/ui/badge";
import type { UserRole } from "@/features/auth/types";
import { Link, usePathname } from "@/i18n/navigation";
import { isRouteImplemented } from "@/lib/routes";
import { cn } from "@/lib/utils";

/**
 * Role-aware navigation list, shared by the desktop sidebar and the mobile
 * drawer. Implemented destinations render as locale-aware links with an active
 * state (via the locale-stripped `usePathname`); not-yet-built destinations
 * render as a non-interactive item with a visible "soon" badge instead of a
 * link, so a user is never sent to a 404.
 */
export function DashboardNav({
  role,
  onNavigate,
}: {
  role: UserRole;
  onNavigate?: () => void;
}) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const items = navItemsForRole(role);

  return (
    <ul className="flex flex-col gap-1">
      {items.map(({ key, href, icon: Icon }) => {
        const label = t(`items.${key}`);
        const implemented = isRouteImplemented(href);
        const isActive =
          implemented &&
          (pathname === href || pathname.startsWith(`${href}/`));

        const baseClasses =
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors";

        if (!implemented) {
          return (
            <li key={key}>
              <span
                aria-disabled="true"
                className={cn(
                  baseClasses,
                  "cursor-not-allowed text-sidebar-foreground/50",
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{label}</span>
                <Badge
                  variant="secondary"
                  className="ms-auto shrink-0 text-[0.65rem]"
                >
                  {t("comingSoon")}
                </Badge>
              </span>
            </li>
          );
        }

        return (
          <li key={key}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                baseClasses,
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
