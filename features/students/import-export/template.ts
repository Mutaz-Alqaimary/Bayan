/**
 * Downloadable import template (Phase 9).
 *
 * A worksheet with the canonical snake_case header row plus one filled-in
 * example row, so a user can't guess the format wrong. The example values are
 * documentation content inside a generated file (not application mock data) —
 * they show the expected shape of each column, including a required Arabic name
 * and an ISO birth date.
 */

import { STUDENT_IMPORT_HEADERS } from "@/features/students/import-export/columns";
import {
  downloadSheet,
  type StudentExportFormat,
} from "@/features/students/import-export/export";
import type { StudentImportRow } from "@/features/students/import-export/types";

/** A single illustrative row demonstrating every column. */
const EXAMPLE_ROW: StudentImportRow = {
  student_number: "1001",
  first_name_ar: "محمد",
  last_name_ar: "العمري",
  first_name_en: "Mohammed",
  last_name_en: "Alamri",
  email: "mohammed.alamri@example.com",
  grade: "5",
  birth_date: "2014-09-01",
};

/** Download the import template in the requested format. */
export async function downloadStudentTemplate(
  format: StudentExportFormat,
): Promise<void> {
  // Loaded on demand (SheetJS is large) — see docs/phases/14-performance.md.
  const XLSX = await import("xlsx");
  const rows: string[][] = [
    [...STUDENT_IMPORT_HEADERS],
    STUDENT_IMPORT_HEADERS.map((field) => EXAMPLE_ROW[field]),
  ];
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  await downloadSheet(sheet, format, "students-import-template");
}
