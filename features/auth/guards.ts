import "server-only";

import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { getSessionUser } from "@/features/auth/queries";
import type { SessionUser, UserRole } from "@/features/auth/types";
import { getPathname } from "@/i18n/navigation";
import { ROUTES } from "@/lib/routes";

/**
 * Server-side route protection. Call at the top of a protected Server Component
 * (or layout/action). Never trust the client — these gate at the data layer,
 * complementing any UI-level hiding.
 *
 * Paths are localized with next-intl's `getPathname` and handed to Next's
 * `redirect` (which is typed `never`, so control flow terminates cleanly).
 */

/** Require an authenticated user; redirect to login otherwise. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    const locale = await getLocale();
    redirect(getPathname({ href: ROUTES.login, locale }));
  }
  return user;
}

/**
 * Require an authenticated user whose role is one of the allowed roles.
 * Unauthenticated users go to login; authenticated-but-unauthorized users are
 * sent home.
 *
 * At least one role is required by the signature, so it can never be called
 * with an empty allow-list (which would otherwise lock out every role).
 */
export async function requireRole(
  role: UserRole,
  ...rest: UserRole[]
): Promise<SessionUser> {
  const allowedRoles = [role, ...rest];
  const user = await requireUser();
  if (!allowedRoles.includes(user.role)) {
    const locale = await getLocale();
    redirect(getPathname({ href: ROUTES.home, locale }));
  }
  return user;
}
