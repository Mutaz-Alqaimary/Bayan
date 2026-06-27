"use client";

import {
  STUDENT_NUMBER_MAX,
  type ClaimStudentMessages,
} from "@/features/students/identity/schemas";
import { useValidationMessages } from "@/lib/validation/client";

/**
 * Client-side localized messages for the claim Zod schema — the mirror of the
 * server's `getClaimMessages` in `features/students/identity/actions.ts`, so
 * client and server validation never drift.
 */
export function useClaimSchemaMessages(): ClaimStudentMessages {
  const validation = useValidationMessages();
  return {
    required: validation.required(),
    tooLong: validation.tooLong(STUDENT_NUMBER_MAX),
  };
}
