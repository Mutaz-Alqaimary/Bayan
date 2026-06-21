"use client";

import { useTranslations } from "next-intl";

import { buildValidationMessages, type ValidationMessages } from "@/lib/validation/types";

/** Localized Zod validation copy for Client Components (forms, live validation). */
export function useValidationMessages(): ValidationMessages {
  const t = useTranslations("validation");
  return buildValidationMessages(t);
}
