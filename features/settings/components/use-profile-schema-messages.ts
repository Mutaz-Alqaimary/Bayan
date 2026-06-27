"use client";

import { useValidationMessages } from "@/lib/validation/client";

import {
  PROFILE_NAME_MAX,
  type UpdateProfileMessages,
} from "@/features/settings/profile-schemas";

/**
 * Client-side localized messages for the profile name Zod schema — the mirror of
 * the server's `getProfileMessages` in `features/settings/profile-actions.ts`,
 * so client and server validation copy never drift.
 */
export function useProfileSchemaMessages(): UpdateProfileMessages {
  const validation = useValidationMessages();
  return {
    required: validation.required(),
    tooLong: validation.tooLong(PROFILE_NAME_MAX),
  };
}
