import {
  BarChart3,
  BookOpen,
  BookOpenText,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Languages,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { UserRole } from "@/features/auth/types";
import { ROUTES, type AppRoute } from "@/lib/routes";

/**
 * Role-aware navigation model for the authenticated app shell. Items reference
 * `ROUTES` (never hardcoded paths); the nav components use `isRouteImplemented`
 * to decide whether an item links somewhere or renders a disabled "coming soon"
 * state, so we never send users to a not-yet-built page.
 *
 * `key` maps to the `nav.items.<key>` message (typed as a literal union so the
 * dynamic `t(\`items.${key}\`)` lookup stays type-safe); `roles` controls
 * visibility per role.
 */
export type NavKey =
  | "dashboard"
  | "students"
  | "teachers"
  | "passages"
  | "vocabulary"
  | "myReading"
  | "analytics"
  | "reports"
  | "settings";

export type NavItem = {
  key: NavKey;
  href: AppRoute;
  icon: LucideIcon;
  roles: readonly UserRole[];
};

export const NAV_ITEMS: readonly NavItem[] = [
  {
    key: "dashboard",
    href: ROUTES.dashboard,
    icon: LayoutDashboard,
    roles: ["admin", "teacher", "student"],
  },
  {
    key: "students",
    href: ROUTES.students,
    icon: Users,
    roles: ["admin", "teacher"],
  },
  {
    key: "teachers",
    href: ROUTES.teachers,
    icon: GraduationCap,
    roles: ["admin"],
  },
  {
    key: "passages",
    href: ROUTES.passages,
    icon: BookOpenText,
    roles: ["admin", "teacher"],
  },
  {
    key: "vocabulary",
    href: ROUTES.vocabulary,
    icon: Languages,
    roles: ["admin", "teacher"],
  },
  {
    key: "myReading",
    href: ROUTES.readingSessions,
    icon: BookOpen,
    roles: ["student"],
  },
  {
    key: "analytics",
    href: ROUTES.analytics,
    icon: BarChart3,
    roles: ["admin", "teacher"],
  },
  {
    key: "reports",
    href: ROUTES.reports,
    icon: FileText,
    roles: ["admin", "teacher"],
  },
  {
    key: "settings",
    href: ROUTES.settings,
    icon: Settings,
    roles: ["admin", "teacher", "student"],
  },
];

/** The nav items visible to a given role, in declaration order. */
export function navItemsForRole(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
