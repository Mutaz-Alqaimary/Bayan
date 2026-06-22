"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

/**
 * Error boundary for the authenticated area (e.g. a dashboard data query
 * failing). Renders a localized, non-technical recovery state inside the app
 * shell, with a retry that re-runs the failed render.
 */
export default function AppError({ reset }: { reset: () => void }) {
  const t = useTranslations("errors");

  return (
    <div className="py-10">
      <ErrorState
        title={t("generic.title")}
        description={t("generic.description")}
        action={<Button onClick={reset}>{t("tryAgain")}</Button>}
      />
    </div>
  );
}
