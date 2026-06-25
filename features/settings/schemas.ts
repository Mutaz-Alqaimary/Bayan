import { z } from "zod";

/**
 * Zod schema for updating personal settings (Phase 12).
 *
 * Same message-injected pattern as the other features: localized copy is passed
 * in per build call (pure, concurrency-safe). This factory is the **server-side
 * re-validation contract** in the Server Action. Every field maps 1:1 to a
 * `user_settings` column and is produced by a constrained control (radio /
 * switch), so a single `invalid` message covers the only failure mode — a value
 * outside the allowed set, reachable via a direct POST to the Server Function.
 *
 * The enum literals mirror `THEMES` (`lib/theme.ts`) and `LOCALES`
 * (`lib/constants.ts`) — the single sources of truth for those value sets.
 */

/** Pre-formatted, localized message the schema needs. */
export type UpdateSettingsMessages = {
  /** A field received a value outside its allowed set. */
  invalid: string;
};

export function buildUpdateSettingsSchema(m: UpdateSettingsMessages) {
  return z.object({
    theme: z.enum(["light", "dark", "system"], { error: m.invalid }),
    locale: z.enum(["ar", "en"], { error: m.invalid }),
    reduced_motion: z.boolean({ error: m.invalid }),
    email_notifications: z.boolean({ error: m.invalid }),
  });
}
