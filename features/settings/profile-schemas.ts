import { z } from "zod";

/**
 * Zod schema for the profile name edit (Phase 12.6, Part 1).
 *
 * Same message-injected pattern as the other features (pure, concurrency-safe):
 * localized copy is passed in per build call and this factory backs **both**
 * client validation and the server action's re-validation, so the two can't
 * drift. Only `full_name` is editable here; the avatar is handled by its own
 * action, and every other `profiles` column is unwritable by clients at the DB
 * layer.
 */

/** Max length for the display name (mirrors the registration name cap). */
export const PROFILE_NAME_MAX = 100;

/** Pre-formatted, localized messages the schema needs. */
export type UpdateProfileMessages = {
  required: string;
  /** Already interpolated with `PROFILE_NAME_MAX`. */
  tooLong: string;
};

export function buildUpdateProfileSchema(m: UpdateProfileMessages) {
  return z.object({
    full_name: z
      .string({ error: m.required })
      .trim()
      .min(1, { error: m.required })
      .max(PROFILE_NAME_MAX, { error: m.tooLong }),
  });
}
