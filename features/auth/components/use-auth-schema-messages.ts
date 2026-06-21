"use client";

import { useTranslations } from "next-intl";

import {
  PASSWORD_MIN_LENGTH,
  type AuthSchemaMessages,
} from "@/features/auth/schemas";
import { useValidationMessages } from "@/lib/validation/client";

/**
 * Client-side localized messages for the auth Zod schemas — the mirror of the
 * server's `getAuthSchemaMessages` in `features/auth/actions.ts`, built from the
 * shared `validation` namespace plus the auth-specific `auth.validation` copy so
 * client and server validation always produce identical messages.
 */
export function useAuthSchemaMessages(): AuthSchemaMessages {
  const validation = useValidationMessages();
  const t = useTranslations("auth.validation");
  return {
    required: validation.required(),
    invalidEmail: validation.invalidEmail(),
    passwordTooShort: validation.tooShort(PASSWORD_MIN_LENGTH),
    passwordMismatch: t("passwordMismatch"),
  };
}
