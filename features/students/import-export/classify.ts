/**
 * Pure classifier for a parsed student import (Phase 9).
 *
 * Runs identically on the client (to build the preview) and on the server (to
 * re-validate at commit) — so the preview can never disagree with what is
 * actually written. No browser or server-only imports.
 *
 * Each row is sorted into exactly one bucket:
 *   - reject  → fails field validation, or collides on a unique key
 *   - create  → new `student_number`, valid
 *   - update  → existing `student_number`, valid, at least one field changed
 *   - skip    → existing `student_number`, valid, identical to the stored record
 *
 * Identity is `student_number` (the approved match key). `email` is additionally
 * checked for uniqueness against other students and other rows, since the
 * `students` table enforces a unique email.
 */

import {
  STUDENT_IMPORT_HEADERS,
  type StudentImportField,
} from "@/features/students/import-export/columns";
import type {
  RawStudentImportRow,
  StudentImportFieldChange,
  StudentImportMessages,
  StudentImportPreview,
  StudentImportRow,
  StudentImportRowError,
  StudentImportRowOutcome,
} from "@/features/students/import-export/types";
import {
  buildCreateStudentSchema,
  type StudentSchemaMessages,
} from "@/features/students/schemas";
import type { StudentRecord } from "@/features/students/types";

/** The editable fields of an existing student, normalized to the file shape. */
export type ExistingStudentSnapshot = StudentImportRow & { id: string };

/** Project a roster record into the all-strings comparison shape. */
export function toExistingSnapshot(
  student: StudentRecord,
): ExistingStudentSnapshot {
  return {
    id: student.id,
    student_number: student.student_number,
    first_name_ar: student.first_name_ar,
    last_name_ar: student.last_name_ar,
    first_name_en: student.first_name_en ?? "",
    last_name_en: student.last_name_en ?? "",
    email: student.email,
    grade: String(student.grade),
    birth_date: student.birth_date ?? "",
  };
}

/** Stable identity for a student number (trimmed). */
function numberKey(value: string): string {
  return value.trim();
}

/** Stable identity for an email (trimmed + lower-cased for uniqueness). */
function emailKey(value: string): string {
  return value.trim().toLowerCase();
}

/** Compare one field's stored value against the incoming value. */
function fieldChanged(
  field: StudentImportField,
  before: string,
  after: string,
): boolean {
  // Grade is compared numerically so "5" vs "05" isn't a spurious change.
  if (field === "grade") {
    return Number(before) !== Number(after);
  }
  return before !== after;
}

/** The field-level diff between a stored record and a validated incoming row. */
function diffFields(
  existing: StudentImportRow,
  incoming: StudentImportRow,
): StudentImportFieldChange[] {
  const changes: StudentImportFieldChange[] = [];
  for (const field of STUDENT_IMPORT_HEADERS) {
    const before = existing[field];
    const after = incoming[field];
    if (fieldChanged(field, before, after)) {
      changes.push({ field, before, after });
    }
  }
  return changes;
}

export type ClassifyInput = {
  rows: RawStudentImportRow[];
  existing: ExistingStudentSnapshot[];
  schemaMessages: StudentSchemaMessages;
  importMessages: StudentImportMessages;
};

/**
 * Classify every parsed row into a create / update / skip / reject preview.
 *
 * Within-file duplicate detection is two-pass: the first pass tallies how often
 * each number/email appears across all rows, so *every* member of a duplicate
 * set is rejected (not just the second occurrence).
 */
export function classifyStudentImport({
  rows,
  existing,
  schemaMessages,
  importMessages,
}: ClassifyInput): StudentImportPreview {
  const schema = buildCreateStudentSchema(schemaMessages);

  const existingByNumber = new Map<string, ExistingStudentSnapshot>();
  const existingNumberByEmail = new Map<string, string>();
  for (const snapshot of existing) {
    existingByNumber.set(numberKey(snapshot.student_number), snapshot);
    existingNumberByEmail.set(
      emailKey(snapshot.email),
      numberKey(snapshot.student_number),
    );
  }

  // Pass 1: count occurrences within the file (only among rows that carry a
  // value for the key, so blanks are left to required-field validation).
  // `numberKey`/`emailKey` normalize identically to the schema's trim (and email
  // lower-case) below, so these tallies stay aligned with the per-row lookups.
  const numberCounts = new Map<string, number>();
  const emailCounts = new Map<string, number>();
  for (const { values } of rows) {
    const number = numberKey(values.student_number);
    if (number) numberCounts.set(number, (numberCounts.get(number) ?? 0) + 1);
    const email = emailKey(values.email);
    if (email) emailCounts.set(email, (emailCounts.get(email) ?? 0) + 1);
  }

  const outcomes: StudentImportRowOutcome[] = rows.map(
    ({ rowNumber, values }) => {
      const errors: StudentImportRowError[] = [];

      // 1) Field validation — same schema as the manual form.
      const parsed = schema.safeParse(values);
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          const field = issue.path[0] as StudentImportField | undefined;
          if (field) errors.push({ field, message: issue.message });
        }
        return reject(rowNumber, values, errors);
      }

      const clean = parsed.data;
      const number = numberKey(clean.student_number);
      const email = emailKey(clean.email);

      // 2) Within-file uniqueness.
      if ((numberCounts.get(number) ?? 0) > 1) {
        errors.push({
          field: "student_number",
          message: importMessages.duplicateNumberInFile,
        });
      }
      if ((emailCounts.get(email) ?? 0) > 1) {
        errors.push({
          field: "email",
          message: importMessages.duplicateEmailInFile,
        });
      }

      // 3) Email must not belong to a *different* existing student.
      const emailOwner = existingNumberByEmail.get(email);
      if (emailOwner !== undefined && emailOwner !== number) {
        errors.push({
          field: "email",
          message: importMessages.emailTakenByOther,
        });
      }

      if (errors.length > 0) {
        return reject(rowNumber, clean, errors);
      }

      // 4) Create vs update vs skip.
      const match = existingByNumber.get(number);
      if (!match) {
        return { rowNumber, classification: "create", values: clean, errors: [], changes: [] };
      }
      const changes = diffFields(match, clean);
      if (changes.length === 0) {
        return { rowNumber, classification: "skip", values: clean, errors: [], changes: [] };
      }
      return { rowNumber, classification: "update", values: clean, errors: [], changes };
    },
  );

  return {
    outcomes,
    counts: {
      create: outcomes.filter((o) => o.classification === "create").length,
      update: outcomes.filter((o) => o.classification === "update").length,
      skip: outcomes.filter((o) => o.classification === "skip").length,
      reject: outcomes.filter((o) => o.classification === "reject").length,
      total: outcomes.length,
    },
  };
}

function reject(
  rowNumber: number,
  values: StudentImportRow,
  errors: StudentImportRowError[],
): StudentImportRowOutcome {
  return { rowNumber, classification: "reject", values, errors, changes: [] };
}
