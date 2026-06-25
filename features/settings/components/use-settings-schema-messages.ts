"use client";

import { useTranslations } from "next-intl";

import type { UpdateSettingsMessages } from "@/features/settings/schemas";

/**
 * Client-side localized messages for the settings Zod schema — the mirror of
 * the server's `getSettingsMessages` in `features/settings/actions.ts`, so
 * client and server validation copy never drift.
 */
export function useSettingsSchemaMessages(): UpdateSettingsMessages {
  const t = useTranslations("settings.validation");
  return { invalid: t("invalid") };
}
