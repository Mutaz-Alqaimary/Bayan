/**
 * Student domain types.
 *
 * `StudentRecord` is the hand-authored domain type for the `students` table as
 * documented in `.claude/rules/database-schema.md`. Once Supabase CLI-generated
 * database types are added (see SupabaseArchitecture.md), this should be derived
 * from them, e.g.
 *   `type StudentRecord = Database["public"]["Tables"]["students"]["Row"]`
 * Generated types are never hand-written.
 *
 * Created in Phase 6 (dashboard reads); the full students feature is built in
 * Phase 7 and will extend this module.
 */

/** A row of the `students` table. */
export type StudentRecord = {
  id: string;
  student_number: string;
  first_name_ar: string;
  last_name_ar: string;
  first_name_en: string | null;
  last_name_en: string | null;
  email: string;
  grade: number;
  birth_date: string | null;
  profile_id: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * The student's display name in the active locale, falling back to the Arabic
 * name (always present) when the English name is missing.
 */
export function studentDisplayName(
  student: Pick<
    StudentRecord,
    "first_name_ar" | "last_name_ar" | "first_name_en" | "last_name_en"
  >,
  locale: string,
): string {
  if (locale === "en" && student.first_name_en && student.last_name_en) {
    return `${student.first_name_en} ${student.last_name_en}`;
  }
  return `${student.first_name_ar} ${student.last_name_ar}`;
}

/**
 * Form value types for the Phase 7 student CRUD forms. Names are fixed by
 * `.claude/rules/naming-conventions.md`.
 *
 * These describe the **form input** shape — every field is a string because
 * that is what the inputs hold (a number input still yields a string, an empty
 * optional field yields `""`). The Zod schemas in `schemas.ts` parse these into
 * the typed insert/update payload (`grade` → number, optional fields → `null`).
 * `react-hook-form` is parameterized with these types, so any drift between a
 * form and its schema surfaces as a type error at the call site.
 *
 * `profile_id` is intentionally absent: Phase 7 manages roster records only and
 * never links them to auth/profile rows (linking is a future dedicated
 * workflow).
 */
export type CreateStudentFormValues = {
  student_number: string;
  first_name_ar: string;
  last_name_ar: string;
  first_name_en: string;
  last_name_en: string;
  email: string;
  grade: string;
  birth_date: string;
};

/** Same editable fields as create — the id is passed separately to the action. */
export type UpdateStudentFormValues = CreateStudentFormValues;
