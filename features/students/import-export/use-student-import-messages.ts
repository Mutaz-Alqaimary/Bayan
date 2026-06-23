"use client";

import { useTranslations } from "next-intl";

import type { StudentImportMessages } from "@/features/students/import-export/types";

/**
 * Client-side localized copy for the import classifier — the mirror of the
 * server's `getImportMessages` in `import-export/actions.ts`, so the preview a
 * user sees and the server's commit-time re-classification can never drift.
 */
export function useStudentImportMessages(): StudentImportMessages {
  const t = useTranslations("students.importExport.reject");
  return {
    duplicateNumberInFile: t("duplicateNumberInFile"),
    duplicateEmailInFile: t("duplicateEmailInFile"),
    emailTakenByOther: t("emailTakenByOther"),
  };
}
