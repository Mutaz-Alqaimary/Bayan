import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/features/auth/guards";
import { routing } from "@/i18n/routing";

/**
 * Authenticated area layout. `requireUser()` gates every page in this group at
 * the data layer (redirecting to login when unauthenticated) and resolves the
 * session used to render the role-aware shell.
 */
export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const user = await requireUser();

  return <AppShell user={user}>{children}</AppShell>;
}
