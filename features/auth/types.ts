/**
 * Auth & profile domain types.
 *
 * `ProfileRecord` is the hand-authored domain type for the `profiles` table as
 * documented in `.claude/rules/database-schema.md`. Once Supabase CLI-generated
 * database types are added (see SupabaseArchitecture.md), this should be derived
 * from them, e.g.
 *   `type ProfileRecord = Database["public"]["Tables"]["profiles"]["Row"]`
 * Generated types are never hand-written.
 */

/** The three platform roles, stored on `profiles.role`. */
export const USER_ROLES = ["admin", "teacher", "student"] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** A row of the `profiles` table. */
export type ProfileRecord = {
  id: string;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  locale: string | null;
  created_at: string;
  updated_at: string;
};

/** The authenticated user joined with their profile — the app's session shape. */
export type SessionUser = {
  id: string;
  email: string | null;
  role: UserRole;
  profile: ProfileRecord;
};
