/**
 * Export the student roster to CSV/XLSX using SheetJS (Phase 9).
 *
 * Client-side only (uses SheetJS + the DOM to trigger a download). Cells are
 * written as plain, unformatted values (ISO dates, raw numbers) so an exported
 * file round-trips cleanly back through import.
 *
 * Arabic encoding:
 *   - XLSX is UTF-8 natively — no special handling.
 *   - CSV is emitted with a leading UTF-8 BOM (`﻿`) so Excel on Windows
 *     detects UTF-8 instead of ANSI and renders Arabic without mojibake.
 */

// Type-only import is erased at build time (zero bundle cost); the SheetJS
// runtime is loaded on demand inside the functions below — see
// docs/phases/14-performance.md.
import type { WorkSheet } from "xlsx";

import {
  STUDENT_IMPORT_HEADERS,
  type StudentImportField,
} from "@/features/students/import-export/columns";
import type { StudentRecord } from "@/features/students/types";

export type StudentExportFormat = "xlsx" | "csv";

/** UTF-8 byte-order mark (U+FEFF) — makes Excel open UTF-8 CSV without mojibake. */
const UTF8_BOM = String.fromCharCode(0xfeff);

/** The canonical, unformatted cell value for a field of a roster record. */
function cellValue(student: StudentRecord, field: StudentImportField): string | number {
  switch (field) {
    case "student_number":
      return student.student_number;
    case "first_name_ar":
      return student.first_name_ar;
    case "last_name_ar":
      return student.last_name_ar;
    case "first_name_en":
      return student.first_name_en ?? "";
    case "last_name_en":
      return student.last_name_en ?? "";
    case "email":
      return student.email;
    case "grade":
      return student.grade;
    case "birth_date":
      return student.birth_date ?? "";
  }
}

/** Build a worksheet (header row + one row per student) from the roster. */
async function buildSheet(students: StudentRecord[]): Promise<WorkSheet> {
  const XLSX = await import("xlsx");
  const rows: (string | number)[][] = [
    [...STUDENT_IMPORT_HEADERS],
    ...students.map((student) =>
      STUDENT_IMPORT_HEADERS.map((field) => cellValue(student, field)),
    ),
  ];
  return XLSX.utils.aoa_to_sheet(rows);
}

/** Trigger a browser download for a Blob under the given filename. */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/** `students-YYYY-MM-DD` — a stable, sortable export filename stem. */
export function exportFilename(stem: string): string {
  const today = new Date();
  const year = String(today.getFullYear()).padStart(4, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${stem}-${year}-${month}-${day}`;
}

/**
 * Download a worksheet in the requested format under `<filename>.<ext>`. Shared
 * by roster export and the template download so both honor the same XLSX/CSV
 * encoding (notably the UTF-8 BOM for Arabic-safe CSV).
 */
export async function downloadSheet(
  sheet: WorkSheet,
  format: StudentExportFormat,
  filename: string,
  sheetName = "Students",
): Promise<void> {
  const XLSX = await import("xlsx");
  if (format === "xlsx") {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    return;
  }

  const csv = `${UTF8_BOM}${XLSX.utils.sheet_to_csv(sheet)}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  downloadBlob(blob, `${filename}.csv`);
}

/** Download the roster as a worksheet in the requested format. */
export async function exportStudents(
  students: StudentRecord[],
  format: StudentExportFormat,
  stem = "students",
): Promise<void> {
  await downloadSheet(await buildSheet(students), format, exportFilename(stem));
}
