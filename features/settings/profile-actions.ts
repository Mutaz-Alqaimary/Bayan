"use server";

import { getLocale, getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";

import { requireUser } from "@/features/auth/guards";
import {
  buildUpdateProfileSchema,
  PROFILE_NAME_MAX,
  type UpdateProfileMessages,
} from "@/features/settings/profile-schemas";
import type {
  AvatarActionResult,
  UpdateProfileFormValues,
  UpdateProfileResult,
} from "@/features/settings/profile-types";
import {
  AVATAR_BUCKET,
  avatarObjectPath,
  avatarStorageKey,
  validateWebpUpload,
} from "@/lib/avatar";
import { ROUTES } from "@/lib/routes";
import { supabaseServerClient } from "@/lib/supabase/server";
import { getValidationMessages } from "@/lib/validation/server";

/**
 * Profile-editing Server Actions (Phase 12.6, Part 1).
 *
 * A user edits **only** their own `full_name` and avatar. Every write runs
 * through the **session client** so the redesigned RLS (`profiles_update_own`)
 * and column privileges (`grant update (full_name, avatar_url)`) are the hard
 * authorization boundary — `role` and every identity field are unwritable by
 * clients, and no service-role escalation is used here.
 *
 * `profiles.avatar_url` stores the bucket-qualified **object path**
 * (`avatars/{user_id}/avatar.webp`), never a URL; the display URL is generated
 * at runtime (`avatarPublicUrl`).
 */

type ErrorCopy = { title: string; description: string };

async function genericError(): Promise<ErrorCopy> {
  const t = await getTranslations("errors");
  return { title: t("generic.title"), description: t("generic.description") };
}

/** A localized error from the `settings.profile.errors` namespace. */
async function profileError(
  key: "invalidImage" | "imageTooLarge" | "uploadFailed" | "saveFailed",
): Promise<ErrorCopy> {
  const t = await getTranslations("settings.profile.errors");
  return { title: t(`${key}.title`), description: t(`${key}.description`) };
}

async function getProfileMessages(): Promise<UpdateProfileMessages> {
  const validation = await getValidationMessages();
  return {
    required: validation.required(),
    tooLong: validation.tooLong(PROFILE_NAME_MAX),
  };
}

/** Revalidate the surfaces that show the user's name/avatar. */
async function revalidateProfile(): Promise<void> {
  const locale = await getLocale();
  revalidatePath(`/${locale}${ROUTES.settings}`);
  revalidatePath(`/${locale}${ROUTES.dashboard}`);
}

// ---------------------------------------------------------------------------
// Display name
// ---------------------------------------------------------------------------

export async function updateProfileAction(
  values: UpdateProfileFormValues,
): Promise<UpdateProfileResult> {
  const user = await requireUser();

  const schema = buildUpdateProfileSchema(await getProfileMessages());
  const parsed = schema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: await genericError() };
  }

  const supabase = await supabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.full_name })
    .eq("id", user.id);

  if (error) {
    // A missing column GRANT / RLS policy surfaces as 42501 — log distinctly,
    // never escalate to the service-role client (data-layer authorization holds).
    if (error.code === "42501") {
      console.error(
        "profiles full_name update blocked by RLS/GRANT (42501). Verify authenticated has UPDATE (full_name, avatar_url) and the profiles_update_own policy exists.",
      );
    }
    return { ok: false, error: await genericError() };
  }

  await revalidateProfile();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Avatar — transactional upload (upload → persist → compensate on failure)
// ---------------------------------------------------------------------------

/**
 * Replace the user's avatar. The client sends an already-WebP, downscaled blob.
 *
 * Transactional with compensation, so Storage and the DB never diverge:
 *  1. validate the received blob (WebP, ≤ 1 MB) — server-side, never trust the client;
 *  2. upload to `avatars/{user_id}/avatar.webp` (`upsert`, stable path → no orphans);
 *  3. only if the upload succeeds, persist the object **path** to `profiles.avatar_url`;
 *  4. if the DB write fails, **remove the just-uploaded object** so no orphan remains.
 * The avatar is considered updated only after both (2) and (3) succeed.
 */
export async function updateAvatarAction(
  formData: FormData,
): Promise<AvatarActionResult> {
  const user = await requireUser();

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: await profileError("invalidImage") };
  }

  const invalid = validateWebpUpload({ type: file.type, size: file.size });
  if (invalid === "type") {
    return { ok: false, error: await profileError("invalidImage") };
  }
  if (invalid === "size") {
    return { ok: false, error: await profileError("imageTooLarge") };
  }

  const supabase = await supabaseServerClient();
  const key = avatarStorageKey(user.id);

  // 1. Upload (overwrite the stable path). Storage RLS confines this to the
  //    user's own folder; failure → nothing is persisted, profile untouched.
  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(key, file, {
      upsert: true,
      contentType: "image/webp",
      cacheControl: "3600",
    });
  if (uploadError) {
    return { ok: false, error: await profileError("uploadFailed") };
  }

  // 2. Persist the object PATH (never a URL). On failure, compensate by removing
  //    the uploaded object so Storage and the DB cannot diverge.
  const objectPath = avatarObjectPath(user.id);
  const { error: dbError } = await supabase
    .from("profiles")
    .update({ avatar_url: objectPath })
    .eq("id", user.id);

  if (dbError) {
    const { error: cleanupError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .remove([key]);
    if (cleanupError) {
      console.error(
        "Avatar compensation failed: uploaded object could not be removed after a failed profile update",
        key,
        cleanupError.message,
      );
    }
    return { ok: false, error: await profileError("saveFailed") };
  }

  await revalidateProfile();
  return { ok: true, avatarPath: objectPath };
}

/**
 * Remove the user's avatar: clear the DB reference first (so nothing points at a
 * deleted object), then best-effort delete the Storage object. A failed delete
 * leaves an object at the stable path that the next upload overwrites — never an
 * accumulating orphan.
 */
export async function removeAvatarAction(): Promise<AvatarActionResult> {
  const user = await requireUser();
  const supabase = await supabaseServerClient();

  const { error: dbError } = await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", user.id);
  if (dbError) {
    return { ok: false, error: await genericError() };
  }

  const { error: removeError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .remove([avatarStorageKey(user.id)]);
  if (removeError) {
    console.error(
      "Avatar object delete failed after clearing profiles.avatar_url (stable path; next upload overwrites)",
      removeError.message,
    );
  }

  await revalidateProfile();
  return { ok: true, avatarPath: null };
}
