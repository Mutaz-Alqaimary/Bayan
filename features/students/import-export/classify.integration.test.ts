import { describe, expect, it } from "vitest";

import { classifyStudentImport } from "@/features/students/import-export/classify";
import type { StudentImportMessages } from "@/features/students/import-export/types";
import type { StudentSchemaMessages } from "@/features/students/schemas";
import { existingSnapshot, importRow } from "@/test/fixtures";

/**
 * Offline integration: the import classifier composes the student Zod schema
 * (field validation) + within-file uniqueness + roster diffing into a
 * create/update/skip/reject preview. Pure, fixture-driven, no DB — the same
 * classification the commit Server Action re-runs server-side.
 */
const schemaMessages: StudentSchemaMessages = {
  required: "REQUIRED",
  invalidEmail: "INVALID_EMAIL",
  nameTooLong: "NAME_LONG",
  numberTooLong: "NUMBER_LONG",
  gradeWholeNumber: "GRADE_WHOLE",
  gradePositive: "GRADE_POS",
  invalidDate: "BAD_DATE",
  dateInFuture: "FUTURE_DATE",
};
const importMessages: StudentImportMessages = {
  duplicateNumberInFile: "DUP_NUMBER",
  duplicateEmailInFile: "DUP_EMAIL",
  emailTakenByOther: "EMAIL_TAKEN",
};

function classify(
  rows: ReturnType<typeof importRow>[],
  existing: ReturnType<typeof existingSnapshot>[] = [],
) {
  return classifyStudentImport({ rows, existing, schemaMessages, importMessages });
}

describe("classifyStudentImport pipeline", () => {
  it("classifies a new, valid row as create", () => {
    const { outcomes } = classify([
      importRow({ student_number: "BYN-NEW00001", email: "new@example.com" }),
    ]);
    expect(outcomes[0].classification).toBe("create");
  });

  it("classifies a changed existing row as update with the field diff", () => {
    const existing = existingSnapshot(); // grade "5"
    const { outcomes } = classify([importRow({ grade: "6" })], [existing]);
    expect(outcomes[0].classification).toBe("update");
    expect(outcomes[0].changes).toContainEqual({ field: "grade", before: "5", after: "6" });
  });

  it("classifies an identical existing row as skip", () => {
    const { outcomes } = classify([importRow()], [existingSnapshot()]);
    expect(outcomes[0].classification).toBe("skip");
  });

  it("does not treat grade \"5\" vs \"05\" as a change (numeric compare)", () => {
    const { outcomes } = classify([importRow({ grade: "05" })], [existingSnapshot({ grade: "5" })]);
    expect(outcomes[0].classification).toBe("skip");
  });

  it("rejects a row that fails field validation", () => {
    const { outcomes } = classify([importRow({ email: "not-an-email" })]);
    expect(outcomes[0].classification).toBe("reject");
    expect(outcomes[0].errors.map((e) => e.message)).toContain("INVALID_EMAIL");
  });

  it("rejects every member of a within-file duplicate number set", () => {
    const { outcomes } = classify([
      importRow({ student_number: "BYN-DUP00001", email: "a@example.com" }, 2),
      importRow({ student_number: "BYN-DUP00001", email: "b@example.com" }, 3),
    ]);
    expect(outcomes.map((o) => o.classification)).toEqual(["reject", "reject"]);
    for (const o of outcomes) {
      expect(o.errors.map((e) => e.message)).toContain("DUP_NUMBER");
    }
  });

  it("rejects within-file duplicate emails", () => {
    const { outcomes } = classify([
      importRow({ student_number: "BYN-AAA00001", email: "same@example.com" }, 2),
      importRow({ student_number: "BYN-BBB00002", email: "same@example.com" }, 3),
    ]);
    for (const o of outcomes) {
      expect(o.errors.map((e) => e.message)).toContain("DUP_EMAIL");
    }
  });

  it("rejects an email already owned by a different existing student", () => {
    const existing = existingSnapshot({ student_number: "BYN-OWNER001", email: "owned@example.com" });
    const { outcomes } = classify(
      [importRow({ student_number: "BYN-OTHER002", email: "owned@example.com" })],
      [existing],
    );
    expect(outcomes[0].classification).toBe("reject");
    expect(outcomes[0].errors.map((e) => e.message)).toContain("EMAIL_TAKEN");
  });

  it("tallies bucket counts for the preview summary", () => {
    const existing = existingSnapshot({ student_number: "BYN-EXIST001", email: "exist@example.com" });
    const { counts } = classify(
      [
        importRow({ student_number: "BYN-CREATE01", email: "c@example.com" }, 2), // create
        importRow({ student_number: "BYN-EXIST001", email: "exist@example.com", grade: "9" }, 3), // update
        importRow({ email: "bad" }, 4), // reject
      ],
      [existing],
    );
    expect(counts).toMatchObject({ create: 1, update: 1, reject: 1, total: 3 });
  });
});
