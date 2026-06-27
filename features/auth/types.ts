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

/**
 * Auth form value types (Phase 5). Names are fixed by
 * `.claude/rules/naming-conventions.md`. These are the single source of truth
 * for each form's shape — the Zod schemas in `features/auth/schemas.ts` are
 * typed against them and `react-hook-form` is parameterized with them.
 */
export type LoginFormValues = {
  email: string;
  password: string;
};

/**
 * Phase 12.5: registration is one-step and creates the complete student
 * identity, so it collects the academic fields the `students` row requires
 * (`first_name_ar`, `last_name_ar`, `grade` are `NOT NULL`). `fullName` is the
 * `profiles` display name; the Arabic names + grade seed the `students` row.
 */
export type RegisterFormValues = {
  fullName: string;
  firstNameAr: string;
  lastNameAr: string;
  email: string;
  grade: string;
  password: string;
  confirmPassword: string;
};

export type ForgotPasswordFormValues = {
  email: string;
};

export type ResetPasswordFormValues = {
  password: string;
  confirmPassword: string;
};
