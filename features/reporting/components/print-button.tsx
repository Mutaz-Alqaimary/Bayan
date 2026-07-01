"use client";

import { Printer } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

/**
 * The single interactive control of the reporting surface: it opens the browser's
 * native print dialog, from which the user saves the report as a PDF (the
 * approved Phase 18 approach — no PDF library, no server generation). Arabic
 * shaping and RTL come from the browser's own print engine, so the printout
 * matches the on-screen document exactly. Hidden from the printout itself.
 */
export function PrintButton() {
  const t = useTranslations("reports");

  return (
    <Button type="button" onClick={() => window.print()} className="print:hidden">
      <Printer aria-hidden="true" />
      {t("print")}
    </Button>
  );
}
