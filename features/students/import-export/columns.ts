/**
 * Canonical column contract for student CSV/XLSX import & export (Phase 9).
 *
 * The file format uses **stable, locale-independent snake_case headers** that
 * mirror the `students` table columns (the approved decision) so a file always
 * round-trips regardless of the UI locale. On import we additionally accept a
 * small set of localized header aliases as a convenience, but the snake_case key
 * is the contract documented by the downloadable template.
 *
 * Only the eight editable roster fields are ever read or written — never `id`,
 * `profile_id`, `created_at`, or `updated_at` (roster-only, matching Phase 7).
 */

/** The editable roster fields, in canonical file column order. */
export const STUDENT_IMPORT_COLUMNS = [
  { field: "student_number", required: true },
  { field: "first_name_ar", required: true },
  { field: "last_name_ar", required: true },
  { field: "first_name_en", required: false },
  { field: "last_name_en", required: false },
  { field: "email", required: true },
  { field: "grade", required: true },
  { field: "birth_date", required: false },
] as const;

/** A canonical import/export field key (a `students` editable column name). */
export type StudentImportField =
  (typeof STUDENT_IMPORT_COLUMNS)[number]["field"];

/** Canonical header keys in column order (the row the template/export writes). */
export const STUDENT_IMPORT_HEADERS: readonly StudentImportField[] =
  STUDENT_IMPORT_COLUMNS.map((column) => column.field);

/** Whether a field must carry a non-empty value (drives required-column checks). */
export const REQUIRED_IMPORT_FIELDS: readonly StudentImportField[] =
  STUDENT_IMPORT_COLUMNS.filter((column) => column.required).map(
    (column) => column.field,
  );

/**
 * Accepted header aliases per field. The canonical key is always accepted; the
 * Arabic and English labels let a user import a file they exported and relabeled
 * by hand. These are data-format identifiers (not UI copy), so they live here as
 * constants rather than in the next-intl message catalog.
 */
const HEADER_ALIASES: Record<StudentImportField, readonly string[]> = {
  student_number: ["student_number", "student number", "رقم الطالب"],
  first_name_ar: ["first_name_ar", "first name (arabic)", "الاسم الأول"],
  last_name_ar: ["last_name_ar", "last name (arabic)", "اسم العائلة"],
  first_name_en: ["first_name_en", "first name (english)", "الاسم الأول بالإنجليزية"],
  last_name_en: ["last_name_en", "last name (english)", "اسم العائلة بالإنجليزية"],
  email: ["email", "البريد الإلكتروني", "البريد"],
  grade: ["grade", "الصف"],
  birth_date: ["birth_date", "birth date", "تاريخ الميلاد"],
};

/** Normalize a raw header cell for matching: trimmed, lower-cased, single-spaced. */
function normalizeHeader(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/gu, " ").replace(/_+/gu, "_");
}

const ALIAS_LOOKUP: ReadonlyMap<string, StudentImportField> = new Map(
  STUDENT_IMPORT_HEADERS.flatMap((field) =>
    HEADER_ALIASES[field].map(
      (alias) => [normalizeHeader(alias), field] as const,
    ),
  ),
);

/** Resolve a raw header cell to a canonical field, or `null` if unrecognized. */
export function resolveImportHeader(raw: string): StudentImportField | null {
  return ALIAS_LOOKUP.get(normalizeHeader(raw)) ?? null;
}
