import type { ExistingStudentSnapshot } from "@/features/students/import-export/classify";
import type {
  RawStudentImportRow,
  StudentImportRow,
} from "@/features/students/import-export/types";

/**
 * Small, explicit fixture builders for the test suite (Phase 16). Deterministic
 * by construction — no clock reads, no randomness. Each builder returns a valid
 * default that individual tests override field-by-field, so a test states only
 * what it cares about.
 */

/** A `reading_sessions`-shaped row, as the analytics reads project it. */
export type SessionRowFixture = {
  student_id: string;
  words_per_minute: number | null;
  accuracy_percentage: number | null;
  /** ISO timestamp. */
  completed_at: string;
};

export function sessionRow(
  overrides: Partial<SessionRowFixture> = {},
): SessionRowFixture {
  return {
    student_id: "student-1",
    words_per_minute: 100,
    accuracy_percentage: 95,
    completed_at: "2026-06-15T10:00:00.000Z",
    ...overrides,
  };
}

/** A fully-valid import row's editable values (override to introduce problems). */
export function importRowValues(
  overrides: Partial<StudentImportRow> = {},
): StudentImportRow {
  return {
    student_number: "BYN-AAAA1111",
    first_name_ar: "محمد",
    last_name_ar: "علي",
    first_name_en: "",
    last_name_en: "",
    email: "student@example.com",
    grade: "5",
    birth_date: "",
    ...overrides,
  };
}

/** A parsed import row paired with its 1-based source row number. */
export function importRow(
  values: Partial<StudentImportRow> = {},
  rowNumber = 2,
): RawStudentImportRow {
  return { rowNumber, values: importRowValues(values) };
}

/** An existing roster snapshot (the classifier's "already in the roster" input). */
export function existingSnapshot(
  overrides: Partial<ExistingStudentSnapshot> = {},
): ExistingStudentSnapshot {
  return {
    id: "existing-1",
    student_number: "BYN-AAAA1111",
    first_name_ar: "محمد",
    last_name_ar: "علي",
    first_name_en: "",
    last_name_en: "",
    email: "student@example.com",
    grade: "5",
    birth_date: "",
    ...overrides,
  };
}
