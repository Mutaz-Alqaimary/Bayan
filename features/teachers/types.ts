/**
 * Teacher Management domain types (Phase 12.6).
 *
 * A teacher is **exactly** a `profiles` row with `role = 'teacher'` — there is no
 * `teachers` table (the role on `profiles` is the single source of truth). These
 * are *views* over `profiles` (+ the auth user's email/sign-in), never new
 * identity. Role management only ever changes `profiles.role`; it never touches
 * the Phase 12.5 identity link (`students.profile_id`), `students`, `auth.users`,
 * or `user_settings`.
 */

/**
 * A teacher account's derived status (teachers always have a profile, so unlike
 * students there is no `roster_only`):
 * - `invited` — linked auth user that has never signed in;
 * - `active`  — has signed in at least once.
 */
export type TeacherAccountStatus = "invited" | "active";

/** A teacher row for the management table. `id` is the `profiles.id`. */
export type TeacherView = {
  id: string;
  fullName: string;
  email: string | null;
  status: TeacherAccountStatus;
  createdAt: string;
};

/** A user eligible to be promoted to teacher (a `role = 'student'` profile). */
export type PromotableUserView = {
  id: string;
  fullName: string;
  email: string | null;
};

/** Discriminated result of a role-change action handed back to the client. */
export type ChangeRoleResult =
  | { ok: true }
  | { ok: false; error: { title: string; description: string } };
