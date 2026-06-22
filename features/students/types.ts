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
