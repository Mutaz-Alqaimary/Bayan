import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";

import type { StudentAccountStatus } from "@/features/students/identity/types";
import type { StudentRecord } from "@/features/students/types";

/**
 * Server-only reads for student identity (Phase 12.5).
 *
 * These run with the **service-role admin client** (passed in by the caller),
 * because they back privileged, server-validated flows (registration
 * reconciliation, claim, account-status display). The locked schema is never
 * mutated here.
 */

const STUDENT_COLUMNS =
  "id, student_number, first_name_ar, last_name_ar, first_name_en, last_name_en, email, grade, birth_date, profile_id, created_at, updated_at";

/** Escape the SQL `LIKE`/`ILIKE` wildcards so an email is matched literally. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/**
 * The roster row for an email, if any (the initial-matching collision check).
 * Matched **case-insensitively** (`ILIKE`): GoTrue lowercases auth emails while
 * `students.email` is stored as typed/imported, so an exact match would miss
 * legitimate collisions (`Foo@x.com` vs `foo@x.com`) and wrongly create a
 * duplicate-in-spirit roster row instead of routing to the secure claim.
 */
export async function getStudentByEmail(
  supabase: SupabaseClient,
  email: string,
): Promise<StudentRecord | null> {
  const { data, error } = await supabase
    .from("students")
    .select(STUDENT_COLUMNS)
    .ilike("email", escapeLike(email))
    .maybeSingle<StudentRecord>();

  if (error) {
    throw new Error(`Failed to look up student by email: ${error.message}`);
  }
  return data ?? null;
}

/**
 * An **unlinked** roster row for a `student_number`, if any — the only rows a
 * claim may attach to. A row already linked (or a non-existent number) returns
 * `null`, so a claim can never steal an already-owned record.
 */
export async function getClaimableStudentByNumber(
  supabase: SupabaseClient,
  studentNumber: string,
): Promise<StudentRecord | null> {
  const { data, error } = await supabase
    .from("students")
    .select(STUDENT_COLUMNS)
    .eq("student_number", studentNumber)
    .is("profile_id", null)
    .maybeSingle<StudentRecord>();

  if (error) {
    throw new Error(`Failed to look up student by number: ${error.message}`);
  }
  return data ?? null;
}

/** Page size for the admin user listing. */
const USERS_PAGE_SIZE = 200;
/** Safety cap on pages walked (school-sized; avoids an unbounded loop). */
const MAX_USER_PAGES = 50;

/**
 * Walk the GoTrue admin user list once and return every user. Shared by
 * account-status derivation and the reconciliation backfill so neither does an
 * N+1 of per-user lookups.
 */
export async function listAllAuthUsers(
  supabase: SupabaseClient,
): Promise<User[]> {
  const all: User[] = [];
  for (let page = 1; page <= MAX_USER_PAGES; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: USERS_PAGE_SIZE,
    });
    if (error) {
      throw new Error(`Failed to list users: ${error.message}`);
    }
    all.push(...data.users);
    if (data.users.length < USERS_PAGE_SIZE) break;
  }
  return all;
}

/**
 * Derive each roster row's {@link StudentAccountStatus}, keyed by `students.id`.
 * `roster_only` needs no auth lookup; linked rows are classified invited/active
 * from the single sign-in map. Resolution is always via `profile_id`, never email.
 */
export async function getStudentAccountStatusMap(
  supabase: SupabaseClient,
  students: Pick<StudentRecord, "id" | "profile_id">[],
): Promise<Map<string, StudentAccountStatus>> {
  const statuses = new Map<string, StudentAccountStatus>();
  const hasLinked = students.some((student) => student.profile_id !== null);
  const signIns = new Map<string, string | null>();
  if (hasLinked) {
    for (const user of await listAllAuthUsers(supabase)) {
      signIns.set(user.id, user.last_sign_in_at ?? null);
    }
  }

  for (const student of students) {
    if (!student.profile_id) {
      statuses.set(student.id, "roster_only");
      continue;
    }
    // `profile_id` equals the auth user id (profiles.id = auth.users.id).
    const lastSignIn = signIns.get(student.profile_id);
    statuses.set(student.id, lastSignIn ? "active" : "invited");
  }
  return statuses;
}
