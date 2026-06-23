"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

/**
 * Error boundary for the passages library (e.g. the query failing). Renders a
 * localized, non-technical recovery state with a retry.
 */
export default function PassagesError({ reset }: { reset: () => void }) {
  const t = useTranslations("passages");
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
