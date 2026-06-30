/**
 * Read a CSV/XLSX file into normalized student rows using SheetJS (Phase 9).
 *
 * Client-side only (invoked from the import wizard). SheetJS auto-detects the
 * file encoding on read, and `cellDates` turns date cells into real `Date`
 * objects so Arabic content and birth dates come through intact.
 *
 * Output rows are the all-strings `StudentImportRow` shape keyed by canonical
 * field, with the source spreadsheet row number attached for error reporting.
 * Validation is deliberately *not* done here — that is the classifier's job.
 */

import {
  resolveImportHeader,
  STUDENT_IMPORT_HEADERS,
  type StudentImportField,
} from "@/features/students/import-export/columns";
import type {
  RawStudentImportRow,
  StudentImportParseResult,
  StudentImportRow,
} from "@/features/students/import-export/types";

/** Upper bound on data rows per import (school-sized rosters; see plan §9). */
export const MAX_IMPORT_ROWS = 2000;

/** An empty value for every canonical field. */
function emptyRow(): StudentImportRow {
  return {
    student_number: "",
    first_name_ar: "",
    last_name_ar: "",
    first_name_en: "",
    last_name_en: "",
    email: "",
    grade: "",
    birth_date: "",
  };
}

/** Format a Date as a timezone-stable `YYYY-MM-DD` (local calendar date). */
function toIsoDate(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Normalize a raw cell value (string / number / Date / blank) to a string. */
function cellToString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return toIsoDate(value);
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return String(value);
  return String(value).trim();
}

/** Whether a normalized row is entirely blank (skipped, not reported). */
function isBlankRow(values: StudentImportRow): boolean {
  return STUDENT_IMPORT_HEADERS.every((field) => values[field] === "");
}

export async function parseStudentImportFile(
  file: File,
): Promise<StudentImportParseResult> {
  let matrix: unknown[][];
  try {
    // Loaded on demand (SheetJS is large) — see docs/phases/14-performance.md.
    const XLSX = await import("xlsx");
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) return { ok: false, error: "empty" };
    const sheet = workbook.Sheets[firstSheetName];
    matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      raw: true,
      blankrows: false,
      defval: "",
    });
  } catch {
    return { ok: false, error: "unreadable" };
  }

  if (matrix.length === 0) return { ok: false, error: "empty" };

  // Map each header column index to a canonical field (unknown columns ignored).
  const [headerRow, ...dataRows] = matrix;

  // Reject oversized files before materializing every row.
  if (dataRows.length > MAX_IMPORT_ROWS) {
    return { ok: false, error: "too_many_rows" };
  }

  const columnField = new Map<number, StudentImportField>();
  headerRow.forEach((cell, index) => {
    const field = resolveImportHeader(cellToString(cell));
    if (field && !columnFieldHasValue(columnField, field)) {
      columnField.set(index, field);
    }
  });

  if (columnField.size === 0) return { ok: false, error: "no_columns" };

  const rows: RawStudentImportRow[] = [];
  dataRows.forEach((cells, dataIndex) => {
    const values = emptyRow();
    for (const [index, field] of columnField) {
      values[field] = cellToString(cells[index]);
    }
    if (isBlankRow(values)) return;
    // Header is spreadsheet row 1, so the first data row is row 2.
    rows.push({ rowNumber: dataIndex + 2, values });
  });

  if (rows.length === 0) return { ok: false, error: "empty" };

  return { ok: true, rows };
}

/** Guard against the same field being claimed by two header columns. */
function columnFieldHasValue(
  map: Map<number, StudentImportField>,
  field: StudentImportField,
): boolean {
  for (const value of map.values()) {
    if (value === field) return true;
  }
  return false;
}
