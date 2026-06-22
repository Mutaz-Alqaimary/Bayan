import { useTranslations } from "next-intl";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Students roster loading skeleton. Mirrors the page layout (header → toolbar →
 * table) so there's no layout shift when the roster streams in. The skeleton is
 * `aria-hidden`; a visually-hidden `role="status"` announces loading.
 */
export default function StudentsLoading() {
  const t = useTranslations("students");

  return (
    <>
      <p role="status" className="sr-only">
        {t("loading")}
      </p>
      <div className="space-y-6" aria-hidden="true">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-44" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Skeleton className="h-10 w-full sm:max-w-xs" />
          <Skeleton className="h-10 w-full sm:w-44" />
        </div>

        <Card className="space-y-3 p-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </Card>
      </div>
    </>
  );
}
