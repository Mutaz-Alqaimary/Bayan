import { useTranslations } from "next-intl";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Settings loading skeleton. Mirrors the page layout (header → four setting
 * cards → save) so there's no layout shift. The skeleton is `aria-hidden`; a
 * visually-hidden `role="status"` announces loading.
 */
export default function SettingsLoading() {
  const t = useTranslations("settings");

  return (
    <>
      <p role="status" className="sr-only">
        {t("loading")}
      </p>
      <div className="mx-auto max-w-2xl space-y-8" aria-hidden="true">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-72" />
        </div>

        <div className="space-y-6">
          {/* Appearance — 3-option grid */}
          <Card className="space-y-4 p-5 sm:p-6">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-64" />
            <div className="grid gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          </Card>

          {/* Language — 2-option grid */}
          <Card className="space-y-4 p-5 sm:p-6">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-56" />
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 2 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          </Card>

          {/* Accessibility & Notifications — switch rows */}
          {Array.from({ length: 2 }).map((_, index) => (
            <Card key={index} className="space-y-4 p-5 sm:p-6">
              <Skeleton className="h-5 w-32" />
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-60" />
                </div>
                <Skeleton className="h-5 w-9 rounded-full" />
              </div>
            </Card>
          ))}

          <div className="flex justify-end">
            <Skeleton className="h-10 w-28" />
          </div>
        </div>
      </div>
    </>
  );
}
