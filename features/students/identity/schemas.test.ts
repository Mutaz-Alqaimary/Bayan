import { describe, expect, it } from "vitest";

import {
  buildClaimStudentSchema,
  STUDENT_NUMBER_MAX,
} from "@/features/students/identity/schemas";

/**
 * The secure roster-claim schema (Phase 12.5). Only the school-issued
 * `student_number` (the claim credential); server-side re-validation contract for
 * `claimStudentRecordAction`.
 */
const schema = buildClaimStudentSchema({ required: "REQUIRED", tooLong: "TOO_LONG" });

function messages(result: { success: boolean; error?: { issues: { message: string }[] } }) {
  return result.success ? [] : (result.error?.issues.map((i) => i.message) ?? []);
}

describe("buildClaimStudentSchema", () => {
  it("accepts a non-empty student number (trimmed)", () => {
    expect(schema.safeParse({ student_number: "BYN-AAAA1111" }).success).toBe(true);
  });

  it("requires a value", () => {
    expect(messages(schema.safeParse({ student_number: "" }))).toContain("REQUIRED");
    expect(messages(schema.safeParse({ student_number: "   " }))).toContain("REQUIRED");
  });

  it("enforces the length cap at the boundary", () => {
    expect(schema.safeParse({ student_number: "a".repeat(STUDENT_NUMBER_MAX) }).success).toBe(true);
    expect(
      messages(schema.safeParse({ student_number: "a".repeat(STUDENT_NUMBER_MAX + 1) })),
    ).toContain("TOO_LONG");
  });
});
