import { useTranslations } from "next-intl";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Dashboard loading skeleton. Mirrors the role dashboards' layout (header → KPI
 * grid → metrics section → activity + side column) so there's no layout shift
 * when the real content streams in. The app shell stays mounted around it.
 *
 * The skeleton itself is `aria-hidden`; a visually-hidden `role="status"`
 * announces the loading state to screen readers.
 */
export default function DashboardLoading() {
  const t = useTranslations("dashboard");

  return (
    <>
      <p role="status" className="sr-only">
        {t("loading")}
      </p>
      <div className="space-y-6" aria-hidden="true">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="space-y-3 p-5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="size-9 rounded-lg" />
            </div>
            <Skeleton className="h-7 w-16" />
          </Card>
        ))}
      </div>

      <Card className="space-y-4 p-5">
        <Skeleton className="h-5 w-40" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="space-y-3 p-5 lg:col-span-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </Card>
        <Card className="space-y-3 p-5">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </Card>
      </div>
    </div>
    </>
  );
}
