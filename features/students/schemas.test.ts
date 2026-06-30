import { describe, expect, it } from "vitest";

import {
  buildCreateStudentSchema,
  buildUpdateStudentSchema,
  NAME_MAX,
  type StudentSchemaMessages,
} from "@/features/students/schemas";

/**
 * Student create/update schema contract (also the import classifier's row-level
 * validation and the Server Action's re-validation). Optional fields allow blank;
 * required fields, email, grade, and birth-date rules are checked by key.
 */
const m: StudentSchemaMessages = {
  required: "REQUIRED",
  invalidEmail: "INVALID_EMAIL",
  nameTooLong: "NAME_LONG",
  numberTooLong: "NUMBER_LONG",
  gradeWholeNumber: "GRADE_WHOLE",
  gradePositive: "GRADE_POS",
  invalidDate: "BAD_DATE",
  dateInFuture: "FUTURE_DATE",
};
const schema = buildCreateStudentSchema(m);

function messages(result: { success: boolean; error?: { issues: { message: string }[] } }) {
  return result.success ? [] : (result.error?.issues.map((i) => i.message) ?? []);
}

const valid = {
  student_number: "BYN-AAAA1111",
  first_name_ar: "محمد",
  last_name_ar: "علي",
  first_name_en: "",
  last_name_en: "",
  email: "student@example.com",
  grade: "5",
  birth_date: "",
};

describe("buildCreateStudentSchema", () => {
  it("accepts a valid row with blank optional fields", () => {
    expect(schema.safeParse(valid).success).toBe(true);
  });

  it("requires the mandatory fields", () => {
    expect(messages(schema.safeParse({ ...valid, student_number: "" }))).toContain("REQUIRED");
    expect(messages(schema.safeParse({ ...valid, first_name_ar: "" }))).toContain("REQUIRED");
  });

  it("validates the email", () => {
    expect(messages(schema.safeParse({ ...valid, email: "not-an-email" }))).toContain("INVALID_EMAIL");
  });

  it("validates grade as a positive whole number", () => {
    expect(messages(schema.safeParse({ ...valid, grade: "3.5" }))).toContain("GRADE_WHOLE");
    expect(messages(schema.safeParse({ ...valid, grade: "0" }))).toContain("GRADE_POS");
  });

  it("rejects an invalid or future birth date but allows blank", () => {
    expect(schema.safeParse({ ...valid, birth_date: "" }).success).toBe(true);
    expect(messages(schema.safeParse({ ...valid, birth_date: "not-a-date" }))).toContain("BAD_DATE");
    expect(messages(schema.safeParse({ ...valid, birth_date: "3000-01-01" }))).toContain("FUTURE_DATE");
  });

  it("enforces the name length cap at the boundary", () => {
    expect(schema.safeParse({ ...valid, first_name_ar: "ا".repeat(NAME_MAX) }).success).toBe(true);
    expect(
      messages(schema.safeParse({ ...valid, first_name_ar: "ا".repeat(NAME_MAX + 1) })),
    ).toContain("NAME_LONG");
  });
});

describe("buildUpdateStudentSchema", () => {
  it("validates the same editable fields as create", () => {
    const update = buildUpdateStudentSchema(m);
    expect(update.safeParse(valid).success).toBe(true);
    expect(messages(update.safeParse({ ...valid, email: "x" }))).toContain("INVALID_EMAIL");
  });
});
