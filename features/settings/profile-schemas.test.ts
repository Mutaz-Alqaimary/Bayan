import { describe, expect, it } from "vitest";

import {
  buildUpdateProfileSchema,
  PROFILE_NAME_MAX,
} from "@/features/settings/profile-schemas";

/**
 * Profile name-edit contract (Phase 12.6). Only `full_name` is editable; the
 * server action re-runs this exact factory.
 */
const schema = buildUpdateProfileSchema({ required: "REQUIRED", tooLong: "TOO_LONG" });

function messages(result: { success: boolean; error?: { issues: { message: string }[] } }) {
  return result.success ? [] : (result.error?.issues.map((i) => i.message) ?? []);
}

describe("buildUpdateProfileSchema", () => {
  it("accepts a trimmed, non-empty name", () => {
    expect(schema.safeParse({ full_name: "Mohammed Ali" }).success).toBe(true);
  });

  it("requires a value", () => {
    expect(messages(schema.safeParse({ full_name: "" }))).toContain("REQUIRED");
    expect(messages(schema.safeParse({ full_name: "   " }))).toContain("REQUIRED");
  });

  it("enforces the length cap at the boundary", () => {
    expect(schema.safeParse({ full_name: "a".repeat(PROFILE_NAME_MAX) }).success).toBe(true);
    expect(
      messages(schema.safeParse({ full_name: "a".repeat(PROFILE_NAME_MAX + 1) })),
    ).toContain("TOO_LONG");
  });
});
