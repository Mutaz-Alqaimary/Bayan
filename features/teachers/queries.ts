import "server-only";

import { requireRole } from "@/features/auth/guards";
import { getAllAuthUsers } from "@/features/students/identity/queries";
import type {
  PromotableUserView,
  TeacherView,
} from "@/features/teachers/types";
import { supabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Server-only reads for Teacher Management (Phase 12.6). Admin only.
 *
 * Teachers and promotable users are *projections of `profiles`* — there is no
 * `teachers` table. Cross-`profiles` reads cross the select-own RLS, so they run
 * through the role-gated **service-role** client (the same pattern the admin
 * dashboard already uses), never the session client.
 */

type ProfileRow = { id: string; full_name: string | null; created_at: string };

/** All teacher accounts (profiles with `role='teacher'`), with email + status. */
export async function getTeachers(): Promise<TeacherView[]> {
  await requireRole("admin");
  const admin = supabaseAdminClient();

  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id, full_name, created_at")
    .eq("role", "teacher")
    .order("created_at", { ascending: false })
    .overrideTypes<ProfileRow[], { merge: false }>();
  if (error) {
    throw new Error(`Failed to load teachers: ${error.message}`);
  }
  if (!profiles || profiles.length === 0) return [];

  // Resolve email + last-sign-in from the request-cached auth user listing
  // (shared with getPromotableUsers on the same /teachers render — one scan).
  const authUsers = await getAllAuthUsers();
  const emailById = new Map<string, string | null>();
  const signInById = new Map<string, string | null>();
  for (const user of authUsers) {
    emailById.set(user.id, user.email ?? null);
    signInById.set(user.id, user.last_sign_in_at ?? null);
  }

  return profiles.map((profile) => ({
    id: profile.id,
    fullName: profile.full_name ?? "",
    email: emailById.get(profile.id) ?? null,
    status: signInById.get(profile.id) ? "active" : "invited",
    createdAt: profile.created_at,
  }));
}

/**
 * Users eligible for promotion to teacher — profiles with `role='student'` (a
 * roster-only student has no profile and therefore cannot be promoted). Includes
 * email to disambiguate people in the promote picker.
 */
export async function getPromotableUsers(): Promise<PromotableUserView[]> {
  await requireRole("admin");
  const admin = supabaseAdminClient();

  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id, full_name, created_at")
    .eq("role", "student")
    .order("created_at", { ascending: false })
    .overrideTypes<ProfileRow[], { merge: false }>();
  if (error) {
    throw new Error(`Failed to load promotable users: ${error.message}`);
  }
  if (!profiles || profiles.length === 0) return [];

  const emailById = new Map<string, string | null>();
  for (const user of await getAllAuthUsers()) {
    emailById.set(user.id, user.email ?? null);
  }

  return profiles.map((profile) => ({
    id: profile.id,
    fullName: profile.full_name ?? "",
    email: emailById.get(profile.id) ?? null,
  }));
}

/**
 * The `profiles.id`s that currently hold the teacher role. Student Management
 * uses this to flag **dual-presence** rows — a promoted teacher who still owns a
 * `students` roster row (intentional: demotion must preserve their reading
 * history). Returned as an array (RSC-serializable); the client builds a Set.
 * Admin/teacher only (the roster surface they share).
 */
export async function getTeacherProfileIds(): Promise<string[]> {
  await requireRole("admin", "teacher");
  const admin = supabaseAdminClient();

  const { data, error } = await admin
    .from("profiles")
    .select("id")
    .eq("role", "teacher")
    .overrideTypes<{ id: string }[], { merge: false }>();
  if (error) {
    throw new Error(`Failed to load teacher ids: ${error.message}`);
  }
  return (data ?? []).map((row) => row.id);
}
