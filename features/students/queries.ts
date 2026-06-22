import "server-only";

import { requireRole } from "@/features/auth/guards";
import type { StudentRecord } from "@/features/students/types";
import { supabaseServerClient } from "@/lib/supabase/server";

/**
 * Server-only typed reads for the students roster.
 *
 * Gated to admin and teacher via `requireRole` (data-layer enforcement — never
 * trust the client), matching the permission matrix in
 * `.claude/rules/architecture.md`. Reads run under the request's session client
 * (RLS-respecting), consistent with how Phase 6 reads the `students` table.
 */

const STUDENT_COLUMNS =
  "id, student_number, first_name_ar, last_name_ar, first_name_en, last_name_en, email, grade, birth_date, profile_id, created_at, updated_at";

/**
 * The full roster, newest first. Search, sorting, filtering, and pagination are
 * performed client-side by the TanStack table so Arabic collation is correct
 * (see `data/collation.ts`); a school-sized roster is well within the size where
 * loading it in one query is appropriate.
 */
export async function getStudents(): Promise<StudentRecord[]> {
  await requireRole("admin", "teacher");
  const supabase = await supabaseServerClient();

  const { data, error } = await supabase
    .from("students")
    .select(STUDENT_COLUMNS)
    .order("created_at", { ascending: false })
    .returns<StudentRecord[]>();

  if (error) {
    throw new Error(`Failed to load students: ${error.message}`);
  }

  return data ?? [];
}
