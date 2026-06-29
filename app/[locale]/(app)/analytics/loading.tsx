import { useTranslations } from "next-intl";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Reading Analytics loading skeleton. Mirrors the page layout (header + range
 * tabs → KPI row → chart cards) so there's no layout shift when data streams in.
 * The skeleton is `aria-hidden`; a visually-hidden `role="status"` announces it.
 */
export default function AnalyticsLoading() {
  const t = useTranslations("analytics");

  return (
    <>
      <p role="status" className="sr-only">
        {t("loading")}
      </p>
      <div className="space-y-6" aria-hidden="true">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-72" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full rounded-xl" />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <Card key={index} className="space-y-4 p-5">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="aspect-[8/3] w-full" />
              <Skeleton className="h-8 w-full" />
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
