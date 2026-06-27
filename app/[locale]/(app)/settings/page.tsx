import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { requireUser } from "@/features/auth/guards";
import { SettingsPage } from "@/features/settings/components/settings-page";
import { getUserSettings } from "@/features/settings/queries";
import type { AppLocale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "settings" });
  return { title: t("title") };
}

/**
 * Personal settings (any authenticated user — all roles manage their own
 * settings). The auth gate runs here and the read is scoped to the signed-in
 * user's own row; loading and error states are handled by the colocated
 * `loading.tsx` / `error.tsx`.
 */
export default async function SettingsRoute({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await requireUser();
  const settings = await getUserSettings(user.id);

  const profile = {
    fullName: user.profile.full_name ?? "",
    avatarPath: user.profile.avatar_url,
    avatarVersion: user.profile.updated_at,
    email: user.email,
    role: user.role,
  };

  return <SettingsPage settings={settings} profile={profile} />;
}
