"use client";

import { useTranslations } from "next-intl";

import {
  CONTENT_MAX,
  MEANING_MAX,
  TITLE_MAX,
  WORD_MAX,
  type ReadingSchemaMessages,
} from "@/features/reading/schemas";
import { useValidationMessages } from "@/lib/validation/client";

/**
 * Client-side localized messages for the reading-content Zod schemas — the
 * mirror of the server's `getReadingSchemaMessages` in
 * `features/reading/actions.ts`, built from the shared `validation` namespace
 * plus the content-specific `reading.validation` copy so client and server
 * validation never drift.
 */
export function useReadingSchemaMessages(): ReadingSchemaMessages {
  const validation = useValidationMessages();
  const t = useTranslations("reading.validation");
  return {
    required: validation.required(),
    titleTooLong: validation.tooLong(TITLE_MAX),
    contentTooLong: validation.tooLong(CONTENT_MAX),
    wordTooLong: validation.tooLong(WORD_MAX),
    meaningTooLong: validation.tooLong(MEANING_MAX),
    wholeNumber: t("wholeNumber"),
    positive: t("positive"),
  };
}
