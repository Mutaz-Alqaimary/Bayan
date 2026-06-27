import { z } from "zod";

import { MANAGEABLE_ROLES } from "@/features/auth/roles";

/**
 * Zod schema for a role change (Phase 12.6). Validates the **shape** of the
 * request reaching the Server Action (reachable via direct POST — never trust
 * the client): a UUID target and a *manageable* destination role. `admin` is not
 * in `MANAGEABLE_ROLES`, so it can never be a valid destination here; the action
 * additionally enforces the full transition policy via `canChangeRole`.
 */

/** Pre-formatted, localized message the schema needs. */
export type ChangeRoleMessages = {
  invalid: string;
};

export function buildChangeRoleSchema(m: ChangeRoleMessages) {
  return z.object({
    profileId: z.string({ error: m.invalid }).uuid({ error: m.invalid }),
    newRole: z.enum(MANAGEABLE_ROLES, { error: m.invalid }),
  });
}
