import { z } from "zod";

/**
 * Zod schema for the secure roster claim (Phase 12.5).
 *
 * Same message-injected, concurrency-safe factory pattern as the other features.
 * The only field is the school-issued `student_number` (the claim credential);
 * it is the server-side re-validation contract for `claimStudentRecordAction`.
 */

export const STUDENT_NUMBER_MAX = 50;

/** Pre-formatted, localized messages the claim schema needs. */
export type ClaimStudentMessages = {
  required: string;
  /** Already interpolated with `STUDENT_NUMBER_MAX`. */
  tooLong: string;
};

export function buildClaimStudentSchema(m: ClaimStudentMessages) {
  return z.object({
    student_number: z
      .string({ error: m.required })
      .trim()
      .min(1, { error: m.required })
      .max(STUDENT_NUMBER_MAX, { error: m.tooLong }),
  });
}
