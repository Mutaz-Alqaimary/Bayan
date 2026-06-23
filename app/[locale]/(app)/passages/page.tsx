import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { requireRole } from "@/features/auth/guards";
import { PassagesPage } from "@/features/reading/components/passages-page";
import { getPassages } from "@/features/reading/queries";
import type { AppLocale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "passages" });
  return { title: t("title") };
}

/**
 * Reading passages library (admin & teacher only). The role gate runs here and
 * again inside `getPassages()` (defense in depth). Loading and error states are
 * handled by the colocated `loading.tsx` / `error.tsx`.
 */
export default async function PassagesRoute({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  await requireRole("admin", "teacher");
  const passages = await getPassages();

  return <PassagesPage passages={passages} />;
}
