import { describe, expect, it } from "vitest";

import {
  buildForgotPasswordSchema,
  buildLoginSchema,
  buildRegisterSchema,
  buildResetPasswordSchema,
  PASSWORD_MIN_LENGTH,
  REGISTER_NAME_MAX,
  type AuthSchemaMessages,
} from "@/features/auth/schemas";

/**
 * Auth schema contracts. The server actions re-run these exact factories, so
 * valid/invalid/localized-key coverage here doubles as the action input contract.
 * Messages are injected as distinctive sentinels so the *correct key* is asserted.
 */
const m: AuthSchemaMessages = {
  required: "REQUIRED",
  invalidEmail: "INVALID_EMAIL",
  passwordTooShort: "PW_SHORT",
  passwordMismatch: "PW_MISMATCH",
  nameTooLong: "NAME_LONG",
  gradeWholeNumber: "GRADE_WHOLE",
  gradePositive: "GRADE_POS",
};

function messages(result: { success: boolean; error?: { issues: { message: string }[] } }) {
  return result.success ? [] : (result.error?.issues.map((i) => i.message) ?? []);
}

const validRegister = {
  fullName: "Mohammed Ali",
  firstNameAr: "محمد",
  lastNameAr: "علي",
  email: "student@example.com",
  grade: "5",
  password: "longenough",
  confirmPassword: "longenough",
};

describe("buildLoginSchema", () => {
  const schema = buildLoginSchema(m);

  it("accepts a well-formed login", () => {
    expect(schema.safeParse({ email: "a@b.com", password: "x" }).success).toBe(true);
  });

  it("rejects a malformed email with invalidEmail", () => {
    expect(messages(schema.safeParse({ email: "nope", password: "x" }))).toContain("INVALID_EMAIL");
  });

  it("rejects a missing password with required", () => {
    expect(messages(schema.safeParse({ email: "a@b.com", password: "" }))).toContain("REQUIRED");
  });
});

describe("buildRegisterSchema", () => {
  const schema = buildRegisterSchema(m);

  it("accepts a complete, valid registration", () => {
    expect(schema.safeParse(validRegister).success).toBe(true);
  });

  it("rejects a password shorter than the minimum", () => {
    const short = "a".repeat(PASSWORD_MIN_LENGTH - 1);
    expect(
      messages(schema.safeParse({ ...validRegister, password: short, confirmPassword: short })),
    ).toContain("PW_SHORT");
  });

  it("rejects mismatched password confirmation", () => {
    expect(
      messages(schema.safeParse({ ...validRegister, confirmPassword: "different!" })),
    ).toContain("PW_MISMATCH");
  });

  it("rejects a non-numeric or non-positive grade", () => {
    expect(messages(schema.safeParse({ ...validRegister, grade: "abc" }))).toContain("GRADE_WHOLE");
    expect(messages(schema.safeParse({ ...validRegister, grade: "0" }))).toContain("GRADE_POS");
  });

  it("enforces the name length cap at the boundary", () => {
    expect(
      schema.safeParse({ ...validRegister, firstNameAr: "ا".repeat(REGISTER_NAME_MAX) }).success,
    ).toBe(true);
    expect(
      messages(schema.safeParse({ ...validRegister, firstNameAr: "ا".repeat(REGISTER_NAME_MAX + 1) })),
    ).toContain("NAME_LONG");
  });
});

describe("buildForgotPasswordSchema", () => {
  const schema = buildForgotPasswordSchema(m);

  it("accepts a valid email and rejects a bad one", () => {
    expect(schema.safeParse({ email: "a@b.com" }).success).toBe(true);
    expect(messages(schema.safeParse({ email: "x" }))).toContain("INVALID_EMAIL");
  });
});

describe("buildResetPasswordSchema", () => {
  const schema = buildResetPasswordSchema(m);

  it("accepts matching, long-enough passwords", () => {
    expect(schema.safeParse({ password: "longenough", confirmPassword: "longenough" }).success).toBe(true);
  });

  it("rejects short and mismatched passwords", () => {
    expect(messages(schema.safeParse({ password: "x", confirmPassword: "x" }))).toContain("PW_SHORT");
    expect(
      messages(schema.safeParse({ password: "longenough", confirmPassword: "other-one" })),
    ).toContain("PW_MISMATCH");
  });
});
