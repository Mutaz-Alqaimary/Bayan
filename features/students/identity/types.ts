/**
 * Student identity & roster-integration types (Phase 12.5).
 *
 * The permanent identity relationship is `auth.users.id ↔ profiles.id ↔
 * students.profile_id`. Email is used only for authentication, communication, and
 * initial roster matching *before* linking — never as the identity (see
 * `.claude/rules/architecture.md`). These types describe the *derived* account
 * state of a roster row and the inputs to the secure claim/provisioning flows.
 */

/**
 * A roster row's account state, derived (no schema column):
 * - `roster_only` — `profile_id IS NULL`: an academic record with no login.
 * - `invited`     — linked to an auth user that has never signed in (provisioned,
 *                   awaiting activation).
 * - `active`      — linked to an auth user that has signed in at least once.
 */
export type StudentAccountStatus = "roster_only" | "invited" | "active";

/** The values the secure claim form submits — the student's school-issued code. */
export type ClaimStudentFormValues = {
  student_number: string;
};

/** Discriminated result of the claim action handed back to the client. */
export type ClaimStudentResult =
  | { ok: true }
  | { ok: false; error: { title: string; description: string } };

/** Discriminated result of generating an admin activation link. */
export type ActivationLinkResult =
  | { ok: true; url: string }
  | { ok: false; error: { title: string; description: string } };

/**
 * Dry-run/apply summary for the one-time roster reconciliation backfill.
 *
 * Reconciliation only **links** a legacy unlinked student-profile to an existing
 * unlinked roster row by email (an admin-vouched administrative match, distinct
 * from the self-service claim which never trusts email). It cannot *create* a
 * roster row for a profile with no match, because `students.grade` is `NOT NULL`
 * and unknown for a bare profile — those are reported as `unmatched` and complete
 * their record via the normal onboarding/claim flow.
 */
export type ReconcileStudentLinksResult =
  | {
      ok: true;
      dryRun: boolean;
      /** Unlinked student-profiles matched to an unlinked roster row by email. */
      linked: number;
      /** Email matched a roster row already linked to a different profile (manual review). */
      conflicts: number;
      /** Unlinked student-profiles with no roster row (await onboarding/claim). */
      unmatched: number;
    }
  | { ok: false; error: { title: string; description: string } };
