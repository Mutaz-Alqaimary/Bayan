import { describe, expect, it } from "vitest";

import { buildChangeRoleSchema } from "@/features/teachers/schemas";

/**
 * Role-change request shape (Phase 12.6). A valid UUID target and a *manageable*
 * destination role only — `admin` can never be a valid destination here (it is
 * not in `MANAGEABLE_ROLES`); the full transition policy is `canChangeRole`.
 */
const schema = buildChangeRoleSchema({ invalid: "INVALID" });
// A well-formed RFC-4122 UUID (version 4, valid variant nibble) — Zod v4's
// `uuid()` enforces the version/variant bits, not just the dash layout.
const uuid = "550e8400-e29b-41d4-a716-446655440000";

describe("buildChangeRoleSchema", () => {
  it("accepts a UUID target with a manageable destination role", () => {
    expect(schema.safeParse({ profileId: uuid, newRole: "teacher" }).success).toBe(true);
    expect(schema.safeParse({ profileId: uuid, newRole: "student" }).success).toBe(true);
  });

  it("rejects admin as a destination role (infrastructure-only)", () => {
    expect(schema.safeParse({ profileId: uuid, newRole: "admin" }).success).toBe(false);
  });

  it("rejects a non-UUID target", () => {
    const result = schema.safeParse({ profileId: "not-a-uuid", newRole: "teacher" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((i) => i.message)).toContain("INVALID");
    }
  });
});
