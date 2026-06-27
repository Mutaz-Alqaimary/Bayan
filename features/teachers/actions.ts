"use server";

import { getLocale, getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/features/auth/guards";
import { canChangeRole, type ManageableRole } from "@/features/auth/roles";
import type { UserRole } from "@/features/auth/types";
import { buildChangeRoleSchema } from "@/features/teachers/schemas";
import type { ChangeRoleResult } from "@/features/teachers/types";
import { ROUTES } from "@/lib/routes";
import { supabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Role-management Server Actions (Phase 12.6). Admin only.
 *
 * The **only** write is `profiles.role` (the single source of truth for who is a
 * teacher). It never touches `students`, `profile_id`, `auth.users`,
 * `user_settings`, or `reading_sessions` — the Phase 12.5 identity model is
 * untouched, so a promoted teacher keeps their (dormant) `students` row + reading
 * history, and demotion is lossless.
 *
 * Admin is infrastructure-only: there is no path here to create, assign, or
 * escalate to `admin` (`MANAGEABLE_ROLES` excludes it and `canChangeRole`
 * rejects it as source or destination), and an actor can never change their own
 * role. The write is run through the role-gated service-role client because
 * `profiles` is select-own under RLS and `role` is unwritable by clients.
 */

type ErrorCopy = { title: string; description: string };

async function genericError(): Promise<ErrorCopy> {
  const t = await getTranslations("errors");
  return { title: t("generic.title"), description: t("generic.description") };
}

/** A localized error from the `teachers.errors` namespace. */
async function teacherError(key: "notAllowed" | "self"): Promise<ErrorCopy> {
  const t = await getTranslations("teachers.errors");
  return { title: t(`${key}.title`), description: t(`${key}.description`) };
}

/**
 * Change a user's role between `student` and `teacher`. Guarded by
 * `canChangeRole` and a `… AND role = <expectedCurrentRole>` update so a stale
 * UI or a concurrent change updates zero rows and fails safely.
 */
async function changeUserRole(
  profileId: string,
  newRole: ManageableRole,
): Promise<ChangeRoleResult> {
  const actor = await requireRole("admin");

  const t = await getTranslations("teachers.validation");
  const schema = buildChangeRoleSchema({ invalid: t("invalid") });
  const parsed = schema.safeParse({ profileId, newRole });
  if (!parsed.success) {
    return { ok: false, error: await genericError() };
  }

  if (parsed.data.profileId === actor.id) {
    return { ok: false, error: await teacherError("self") };
  }

  const admin = supabaseAdminClient();
  const { data: target, error: loadError } = await admin
    .from("profiles")
    .select("role")
    .eq("id", parsed.data.profileId)
    .maybeSingle<{ role: UserRole }>();

  if (loadError) {
    return { ok: false, error: await genericError() };
  }
  if (!target) {
    return { ok: false, error: await teacherError("notAllowed") };
  }

  if (
    !canChangeRole({
      actorRole: actor.role,
      targetCurrentRole: target.role,
      targetNewRole: parsed.data.newRole,
      isSelf: false,
    })
  ) {
    return { ok: false, error: await teacherError("notAllowed") };
  }

  // Guarded update: only flips the row if it still holds the expected role.
  const { data: updated, error: updateError } = await admin
    .from("profiles")
    .update({ role: parsed.data.newRole })
    .eq("id", parsed.data.profileId)
    .eq("role", target.role)
    .select("id");

  if (updateError) {
    return { ok: false, error: await genericError() };
  }
  if (!updated || updated.length === 0) {
    return { ok: false, error: await teacherError("notAllowed") };
  }

  console.log(
    `[role-change] actor=${actor.id} target=${parsed.data.profileId} ${target.role}->${parsed.data.newRole}`,
  );

  const locale = await getLocale();
  revalidatePath(`/${locale}${ROUTES.teachers}`);
  revalidatePath(`/${locale}${ROUTES.students}`);
  revalidatePath(`/${locale}${ROUTES.dashboard}`);
  return { ok: true };
}

/** Promote a `student` user to `teacher`. */
export async function promoteToTeacherAction(
  profileId: string,
): Promise<ChangeRoleResult> {
  return changeUserRole(profileId, "teacher");
}

/** Demote a `teacher` back to `student` (keeps roster row + reading history). */
export async function demoteToStudentAction(
  profileId: string,
): Promise<ChangeRoleResult> {
  return changeUserRole(profileId, "student");
}
