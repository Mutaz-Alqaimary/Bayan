"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

/**
 * Error boundary for Reading Analytics (e.g. an analytics query failing).
 * Renders a localized, non-technical recovery state with a retry that re-runs
 * the failed render.
 */
export default function AnalyticsError({ reset }: { reset: () => void }) {
  const t = useTranslations("analytics");
  const tErrors = useTranslations("errors");

  return (
    <div className="py-10">
      <ErrorState
        title={t("error.title")}
        description={t("error.description")}
        action={<Button onClick={reset}>{tErrors("tryAgain")}</Button>}
      />
    </div>
  );
}
