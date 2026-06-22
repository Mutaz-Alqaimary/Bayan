"use client";

import { useTranslations } from "next-intl";

import {
  NAME_MAX,
  NUMBER_MAX,
  type StudentSchemaMessages,
} from "@/features/students/schemas";
import { useValidationMessages } from "@/lib/validation/client";

/**
 * Client-side localized messages for the student Zod schemas — the mirror of the
 * server's `getStudentSchemaMessages` in `features/students/actions.ts`, built
 * from the shared `validation` namespace plus the student-specific
 * `students.validation` copy so client and server validation never drift.
 */
export function useStudentSchemaMessages(): StudentSchemaMessages {
  const validation = useValidationMessages();
  const t = useTranslations("students.validation");
  return {
    required: validation.required(),
    invalidEmail: validation.invalidEmail(),
    nameTooLong: validation.tooLong(NAME_MAX),
    numberTooLong: validation.tooLong(NUMBER_MAX),
    gradeWholeNumber: t("wholeNumber"),
    gradePositive: t("positive"),
    invalidDate: t("invalidDate"),
    dateInFuture: t("dateInFuture"),
  };
}
