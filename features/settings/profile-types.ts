import type { UserRole } from "@/features/auth/types";

/**
 * Profile-editing domain & form types (Phase 12.6, Part 1).
 *
 * Profile editing lives inside the existing Settings page (no new page). A user
 * may edit **only** their own `full_name` and avatar; `email` and `role` are
 * shown read-only for context (email is admin-managed; role is changed only by
 * the privileged Teacher-Management server action). All identity/authorization
 * fields are unwritable by clients at the database layer (the redesigned
 * `profiles_update_own` policy + column privileges — see Phase 12.6 §P1.6).
 */

/** The profile fields the Settings "Profile" card reads. */
export type ProfileData = {
  /** `profiles.full_name` (editable). */
  fullName: string;
  /** `profiles.avatar_url` — the stored **object path**, or `null` (editable via upload). */
  avatarPath: string | null;
  /** Cache-bust token for the avatar URL (the profile's `updated_at`). */
  avatarVersion: string;
  /** Read-only: the auth email (admin/teacher-managed). */
  email: string | null;
  /** Read-only: the user's role. */
  role: UserRole;
};

/** The name form's submission shape (avatar is handled by its own action). */
export type UpdateProfileFormValues = {
  full_name: string;
};

/** Discriminated result of the name-update action. */
export type UpdateProfileResult =
  | { ok: true }
  | { ok: false; error: { title: string; description: string } };

/** Discriminated result of the avatar upload/remove actions. */
export type AvatarActionResult =
  | { ok: true; avatarPath: string | null }
  | { ok: false; error: { title: string; description: string } };
