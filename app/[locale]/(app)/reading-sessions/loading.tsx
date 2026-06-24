import { useTranslations } from "next-intl";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Reading-sessions loading skeleton. Mirrors the page layout (header → start
 * card → history) so there's no layout shift. The skeleton is `aria-hidden`; a
 * visually-hidden `role="status"` announces loading.
 */
export default function ReadingSessionsLoading() {
  const t = useTranslations("readingSessions");

  return (
    <>
      <p role="status" className="sr-only">
        {t("loading")}
      </p>
      <div className="space-y-8" aria-hidden="true">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>

        <Card className="space-y-4 p-5">
          <Skeleton className="h-5 w-48" />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-32" />
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full" />
          ))}
        </div>

        <Card className="space-y-3 p-5">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-full" />
        </Card>

        <Card className="space-y-3 p-5">
          <Skeleton className="h-5 w-36" />
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </Card>
      </div>
    </>
  );
}
