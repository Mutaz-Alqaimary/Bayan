import { setRequestLocale } from "next-intl/server";

import { SiteHeader } from "@/components/layout/site-header";
import type { AppLocale } from "@/i18n/routing";

import { UiGallery } from "./ui-gallery";

/*
 * TEMPORARY — Phase 3 design-system visual verification page.
 * Showcases every component in both /ar (RTL) and /en (LTR). Use the header's
 * language switcher and theme toggle to verify RTL/LTR and light/dark.
 * Remove (or move behind a dev flag) before production.
 */
export default async function UiGalleryPage({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader />
      <main
        id="main-content"
        className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8"
      >
        <UiGallery />
      </main>
    </div>
  );
}
