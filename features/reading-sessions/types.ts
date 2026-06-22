/**
 * Reading-session domain types.
 *
 * `ReadingSessionRecord` is the hand-authored domain type for the
 * `reading_sessions` table as documented in `.claude/rules/database-schema.md`.
 * Once Supabase CLI-generated database types exist (see SupabaseArchitecture.md)
 * this should be derived from them. Generated types are never hand-written.
 *
 * Created in Phase 6 (dashboard reads); the reading-fluency feature is built in
 * Phase 10 and will extend this module.
 *
 * `words_per_minute`, `accuracy_percentage`, `duration_seconds`, and
 * `completed_at` are nullable in the schema (an in-progress or unscored session
 * may not have them yet).
 */

/** A row of the `reading_sessions` table. */
export type ReadingSessionRecord = {
  id: string;
  student_id: string;
  passage_id: string;
  words_per_minute: number | null;
  accuracy_percentage: number | null;
  duration_seconds: number | null;
  completed_at: string | null;
  created_at: string;
};
