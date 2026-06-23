import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { requireRole } from "@/features/auth/guards";
import { VocabularyPage } from "@/features/reading/components/vocabulary-page";
import { getPassageOptions, getVocabularyTerms } from "@/features/reading/queries";
import type { AppLocale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "vocabulary" });
  return { title: t("title") };
}

/**
 * Global vocabulary list (admin & teacher only). Loads all terms plus the
 * passage options needed for the required passage selector and the passage
 * filter. The role gate runs here and again inside each query (defense in depth).
 */
export default async function VocabularyRoute({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  await requireRole("admin", "teacher");
  const [terms, passages] = await Promise.all([
    getVocabularyTerms(),
    getPassageOptions(),
  ]);

  return <VocabularyPage terms={terms} passages={passages} />;
}
