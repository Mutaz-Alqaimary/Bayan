"use client";

import { useTranslations } from "next-intl";

import { buildErrorMessages, type ErrorMessages } from "@/lib/errors/types";

/** Safe, localized error copy for Client Components (`ErrorState`, `toast()`). */
export function useErrorMessages(): ErrorMessages {
  const t = useTranslations("errors");
  return buildErrorMessages(t);
}
