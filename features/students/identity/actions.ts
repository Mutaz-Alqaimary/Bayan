"use server";

import { getLocale, getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { requireRole } from "@/features/auth/guards";
import { getLinkedStudentId } from "@/features/reading/sessions/queries";
import {
  getClaimableStudentByNumber,
  listAllAuthUsers,
} from "@/features/students/identity/queries";
import {
  buildClaimStudentSchema,
  STUDENT_NUMBER_MAX,
  type ClaimStudentMessages,
} from "@/features/students/identity/schemas";
import type {
  ActivationLinkResult,
  ClaimStudentFormValues,
  ClaimStudentResult,
  ReconcileStudentLinksResult,
} from "@/features/students/identity/types";
import { getPathname } from "@/i18n/navigation";
import { ROUTES } from "@/lib/routes";
import { supabaseAdminClient } from "@/lib/supabase/admin";
import { getValidationMessages } from "@/lib/validation/server";

/**
 * Student identity & roster-integration Server Actions (Phase 12.5).
 *
 * Every privileged write runs through the service-role admin client and resolves
 * a student strictly by the permanent identity link (`profile_id` /
 * `auth.users.id`), never by email. Email is only a communication / initial
 * roster-matching attribute (see `.claude/rules/architecture.md`).
 */

type ErrorCopy = { title: string; description: string };

async function genericError(): Promise<ErrorCopy> {
  const t = await getTranslations("errors");
  return { title: t("generic.title"), description: t("generic.description") };
}

async function claimError(
  key: "alreadyLinked" | "invalidCode" | "emailInUse",
): Promise<ErrorCopy> {
  const t = await getTranslations("students.identity.errors");
  return { title: t(`${key}.title`), description: t(`${key}.description`) };
}

async function getClaimMessages(): Promise<ClaimStudentMessages> {
  const validation = await getValidationMessages();
  return {
    required: validation.required(),
    tooLong: validation.tooLong(STUDENT_NUMBER_MAX),
  };
}

// ---------------------------------------------------------------------------
// Secure claim (student-initiated, credential = student_number)
// ---------------------------------------------------------------------------

/**
 * Link the signed-in student to an existing **unlinked** roster row using its
 * school-issued `student_number` (the claim secret). Never claims by email. A
 * student who is already linked, an unknown/already-claimed number, or a lost
 * race all return a safe localized error and change nothing.
 */
export async function claimStudentRecordAction(
  values: ClaimStudentFormValues,
): Promise<ClaimStudentResult> {
  const user = await requireRole("student");

  // Already has a roster record → nothing to claim.
  const existing = await getLinkedStudentId(user.profile.id);
  if (existing) {
    return { ok: false, error: await claimError("alreadyLinked") };
  }

  const schema = buildClaimStudentSchema(await getClaimMessages());
  const parsed = schema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: await genericError() };
  }

  const admin = supabaseAdminClient();
  const row = await getClaimableStudentByNumber(
    admin,
    parsed.data.student_number,
  );
  if (!row) {
    return { ok: false, error: await claimError("invalidCode") };
  }

  // Atomic link guarded by `profile_id IS NULL` so two simultaneous claims can't
  // both win (the second updates zero rows).
  const { data, error } = await admin
    .from("students")
    .update({ profile_id: user.profile.id })
    .eq("id", row.id)
    .is("profile_id", null)
    .select("id");

  if (error) {
    return { ok: false, error: await genericError() };
  }
  if (!data || data.length === 0) {
    return { ok: false, error: await claimError("invalidCode") };
  }

  const locale = await getLocale();
  revalidatePath(`/${locale}${ROUTES.readingSessions}`);
  revalidatePath(`/${locale}${ROUTES.dashboard}`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Admin activation link (provision an account for a roster student, no SMTP)
// ---------------------------------------------------------------------------

type ActivationStudentRow = {
  id: string;
  email: string;
  first_name_ar: string;
  last_name_ar: string;
  profile_id: string | null;
};

/** Absolute set-password URL the activation link returns the student to. */
async function buildActivationRedirect(): Promise<string> {
  const locale = await getLocale();
  const headerList = await headers();
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ??
    headerList.get("origin") ??
    `${headerList.get("x-forwarded-proto") ?? "https"}://${headerList.get("host") ?? ""}`;
  const resetPath = getPathname({ href: ROUTES.resetPassword, locale });
  return `${origin}${ROUTES.authCallback}?next=${encodeURIComponent(resetPath)}`;
}

/**
 * Generate a copyable activation link (Supabase `generateLink`, **no email
 * sent**) for a roster student. If the student isn't linked yet, provisions the
 * account first (create auth user → create profile → set `profile_id`) with
 * compensation on failure; if already linked, re-issues a set-password link for
 * the existing identity. Admin/teacher only.
 */
export async function generateStudentActivationLinkAction(
  studentId: string,
): Promise<ActivationLinkResult> {
  await requireRole("admin", "teacher");
  if (!studentId) {
    return { ok: false, error: await genericError() };
  }

  const admin = supabaseAdminClient();
  const { data: student, error: loadError } = await admin
    .from("students")
    .select("id, email, first_name_ar, last_name_ar, profile_id")
    .eq("id", studentId)
    .maybeSingle<ActivationStudentRow>();

  if (loadError) {
    return { ok: false, error: await genericError() };
  }
  if (!student) {
    return { ok: false, error: await genericError() };
  }

  let email = student.email;

  if (!student.profile_id) {
    // Provision: create the auth user (no password, no `email_confirm` — the
    // email is honestly unverified until the student uses the link).
    const fullName = `${student.first_name_ar} ${student.last_name_ar}`.trim();
    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        email: student.email,
        user_metadata: { full_name: fullName },
      });

    if (createError || !created.user) {
      // Most likely an auth user already exists for this email.
      return { ok: false, error: await claimError("emailInUse") };
    }

    const authUserId = created.user.id;
    const locale = await getLocale();
    const { error: profileError } = await admin.from("profiles").insert({
      id: authUserId,
      full_name: fullName,
      role: "student",
      locale,
    });
    if (profileError) {
      await admin.auth.admin.deleteUser(authUserId); // compensate
      return { ok: false, error: await genericError() };
    }

    const { data: linked, error: linkError } = await admin
      .from("students")
      .update({ profile_id: authUserId })
      .eq("id", student.id)
      .is("profile_id", null)
      .select("id");
    if (linkError || !linked || linked.length === 0) {
      await admin.auth.admin.deleteUser(authUserId); // compensate (cascades profile)
      return { ok: false, error: await genericError() };
    }
  } else {
    // Already linked — issue a fresh link for the existing identity's email.
    const { data: got, error: getError } =
      await admin.auth.admin.getUserById(student.profile_id);
    if (getError || !got.user?.email) {
      return { ok: false, error: await genericError() };
    }
    email = got.user.email;
  }

  const { data: linkData, error: linkError } =
    await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: await buildActivationRedirect() },
    });

  const actionLink = linkData?.properties?.action_link;
  if (linkError || !actionLink) {
    return { ok: false, error: await genericError() };
  }

  const locale = await getLocale();
  revalidatePath(`/${locale}${ROUTES.students}`);
  return { ok: true, url: actionLink };
}

// ---------------------------------------------------------------------------
// One-time reconciliation backfill (admin-only, dry-run first)
// ---------------------------------------------------------------------------

type ReconcileStudentRow = {
  id: string;
  email: string;
  profile_id: string | null;
};

/**
 * Link legacy unlinked student-profiles to existing unlinked roster rows by
 * email — an **admin-vouched** administrative match (distinct from the
 * self-service claim, which never trusts email). Cannot create rows for
 * unmatched profiles (`grade` is `NOT NULL` and unknown); those are reported as
 * `unmatched`. Idempotent and dry-run-able. Admin only.
 */
export async function reconcileStudentLinksAction(
  dryRun: boolean,
): Promise<ReconcileStudentLinksResult> {
  await requireRole("admin");
  const admin = supabaseAdminClient();

  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("id")
    .eq("role", "student")
    .returns<{ id: string }[]>();
  if (profilesError) {
    return { ok: false, error: await genericError() };
  }

  const { data: students, error: studentsError } = await admin
    .from("students")
    .select("id, email, profile_id")
    .returns<ReconcileStudentRow[]>();
  if (studentsError) {
    return { ok: false, error: await genericError() };
  }

  const linkedProfileIds = new Set(
    (students ?? [])
      .map((student) => student.profile_id)
      .filter((id): id is string => id !== null),
  );
  const unlinkedProfiles = (profiles ?? []).filter(
    (profile) => !linkedProfileIds.has(profile.id),
  );

  if (unlinkedProfiles.length === 0) {
    return { ok: true, dryRun, linked: 0, conflicts: 0, unmatched: 0 };
  }

  // Resolve each unlinked profile's email from auth (never stored on profiles).
  // Compare case-insensitively + trimmed: GoTrue normalizes auth emails, while
  // students.email is as typed/imported, so an exact match would miss legitimate
  // pairs (e.g. `Foo@x.com` vs `foo@x.com`).
  const normalize = (value: string) => value.trim().toLowerCase();
  const emailByUserId = new Map<string, string>();
  for (const user of await listAllAuthUsers(admin)) {
    if (user.email) emailByUserId.set(user.id, normalize(user.email));
  }

  let linked = 0;
  let conflicts = 0;
  let unmatched = 0;

  for (const profile of unlinkedProfiles) {
    const email = emailByUserId.get(profile.id);
    const roster = email
      ? (students ?? []).find((student) => normalize(student.email) === email)
      : undefined;

    if (!roster) {
      unmatched += 1;
      continue;
    }
    if (roster.profile_id && roster.profile_id !== profile.id) {
      conflicts += 1;
      continue;
    }
    if (roster.profile_id === profile.id) {
      continue; // already linked — no-op (idempotent)
    }

    if (!dryRun) {
      const { data: updated, error: updateError } = await admin
        .from("students")
        .update({ profile_id: profile.id })
        .eq("id", roster.id)
        .is("profile_id", null)
        .select("id");
      if (updateError || !updated || updated.length === 0) {
        conflicts += 1;
        continue;
      }
    }
    linked += 1;
  }

  if (!dryRun && linked > 0) {
    const locale = await getLocale();
    revalidatePath(`/${locale}${ROUTES.students}`);
  }
  return { ok: true, dryRun, linked, conflicts, unmatched };
}
