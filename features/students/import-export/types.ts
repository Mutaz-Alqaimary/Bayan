/**
 * Shared types for the student import/export pipeline (Phase 9).
 *
 * Framework-agnostic and serializable so the same shapes flow through the
 * client preview and across the Server Action boundary at commit time. No
 * browser or server-only imports here.
 */

import type { StudentImportField } from "@/features/students/import-export/columns";
import type { CreateStudentFormValues } from "@/features/students/types";

/**
 * One parsed row's editable values, keyed by canonical field. Mirrors the
 * manual form's all-strings shape (`CreateStudentFormValues`) so the exact same
 * Zod schema validates both paths — missing columns arrive as `""`.
 */
export type StudentImportRow = CreateStudentFormValues;

/** A parsed row paired with its 1-based source row number in the file. */
export type RawStudentImportRow = {
  /** Spreadsheet row number (header is row 1, first data row is row 2). */
  rowNumber: number;
  values: StudentImportRow;
};

/** How a row will be treated at commit. */
export type StudentImportClassification =
  | "create"
  | "update"
  | "skip"
  | "reject";

/** A single field-level validation/duplicate problem on a row. */
export type StudentImportRowError = {
  field: StudentImportField;
  message: string;
};

/** A before → after change for one field of an updated student. */
export type StudentImportFieldChange = {
  field: StudentImportField;
  before: string;
  after: string;
};

/** The classification outcome for one parsed row. */
export type StudentImportRowOutcome = {
  rowNumber: number;
  classification: StudentImportClassification;
  values: StudentImportRow;
  /** Present (non-empty) only when `classification === "reject"`. */
  errors: StudentImportRowError[];
  /** Present (non-empty) only when `classification === "update"`. */
  changes: StudentImportFieldChange[];
};

/** Bucket counts for the preview summary. */
export type StudentImportCounts = {
  create: number;
  update: number;
  skip: number;
  reject: number;
  total: number;
};

/** Full classification of an upload — the data the preview UI renders. */
export type StudentImportPreview = {
  outcomes: StudentImportRowOutcome[];
  counts: StudentImportCounts;
};

/** Why a whole file couldn't be parsed (distinct from per-row rejects). */
export type StudentImportParseError =
  | "unreadable"
  | "empty"
  | "no_columns"
  | "too_many_rows";

/** Result of reading a CSV/XLSX file into rows (client-side). */
export type StudentImportParseResult =
  | { ok: true; rows: RawStudentImportRow[] }
  | { ok: false; error: StudentImportParseError };

/** Localized copy the classifier needs beyond the shared schema messages. */
export type StudentImportMessages = {
  /** Same student_number appears more than once in the uploaded file. */
  duplicateNumberInFile: string;
  /** Same email appears more than once in the uploaded file. */
  duplicateEmailInFile: string;
  /** Email already belongs to a different existing student. */
  emailTakenByOther: string;
};

/** Discriminated result handed back from the commit Server Action. */
export type StudentImportCommitResult =
  | { ok: true; created: number; updated: number }
  | {
      ok: false;
      error: { title: string; description: string };
      /** Server-detected rejects (re-validation found problems) — nothing written. */
      rejects?: StudentImportRowOutcome[];
    };
