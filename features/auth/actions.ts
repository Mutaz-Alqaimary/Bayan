"use server";

import { getLocale, getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getSessionUser } from "@/features/auth/queries";
import {
  buildForgotPasswordSchema,
  buildLoginSchema,
  buildRegisterSchema,
  buildResetPasswordSchema,
  PASSWORD_MIN_LENGTH,
  REGISTER_NAME_MAX,
  type AuthSchemaMessages,
} from "@/features/auth/schemas";
import { getStudentByEmail } from "@/features/students/identity/queries";
import { generateUniqueStudentNumber } from "@/features/students/identity/student-number";
import type {
  ForgotPasswordFormValues,
  LoginFormValues,
  RegisterFormValues,
  ResetPasswordFormValues,
} from "@/features/auth/types";
import { getPathname } from "@/i18n/navigation";
import { getValidationMessages } from "@/lib/validation/server";
import { ROUTES } from "@/lib/routes";
import { supabaseAdminClient } from "@/lib/supabase/admin";
import { supabaseServerClient } from "@/lib/supabase/server";

/**
 * Auth Server Actions (Phase 5).
 *
 * Every action re-validates its input with the same Zod schema the client used
 * (never trust the client — Server Functions are reachable via direct POST), maps
 * any failure to safe, localized, non-technical copy, and on success either
 * `redirect`s (login/register/reset) or returns a neutral success (forgot).
 *
 * The registration failure strategy (atomic create + compensating delete) is
 * documented in `SupabaseArchitecture.md`.
 */

export type AuthErrorCopy = { title: string; description: string };

/** Discriminated result handed back to the client form. */
export type AuthActionResult =
  | { ok: true }
  | { ok: false; error: AuthErrorCopy };

/** Build the localized validation messages the Zod schemas need (server side). */
async function getAuthSchemaMessages(): Promise<AuthSchemaMessages> {
  const validation = await getValidationMessages();
  const t = await getTranslations("auth.validation");
  return {
    required: validation.required(),
    invalidEmail: validation.invalidEmail(),
    passwordTooShort: validation.tooShort(PASSWORD_MIN_LENGTH),
    passwordMismatch: t("passwordMismatch"),
    nameTooLong: validation.tooLong(REGISTER_NAME_MAX),
    gradeWholeNumber: t("gradeWholeNumber"),
    gradePositive: t("gradePositive"),
  };
}

/** A safe, localized error from the `auth.errors` namespace. */
async function authError(
  key:
    | "invalidCredentials"
    | "emailTaken"
    | "signUpFailed"
    | "resetFailed"
    | "weakPassword"
    | "profileMissing",
): Promise<AuthErrorCopy> {
  const t = await getTranslations("auth.errors");
  return { title: t(`${key}.title`), description: t(`${key}.description`) };
}

/** The shared generic fallback (network/unexpected) from the `errors` namespace. */
async function genericError(): Promise<AuthErrorCopy> {
  const t = await getTranslations("errors");
  return { title: t("generic.title"), description: t("generic.description") };
}

/** Localized dashboard path for the current request locale. */
async function dashboardPath(): Promise<string> {
  const locale = await getLocale();
  return getPathname({ href: ROUTES.dashboard, locale });
}

/**
 * Compensating rollback of a half-built registration: delete the auth user
 * (cascades any `profiles`/`user_settings` rows already created) and clear the
 * just-established cookie session so no stranded session points at a deleted
 * user. Best-effort — a delete failure is logged; the login boundary still
 * refuses a profile-less session.
 */
async function rollbackSignUp(
  admin: ReturnType<typeof supabaseAdminClient>,
  supabase: Awaited<ReturnType<typeof supabaseServerClient>>,
  userId: string,
): Promise<void> {
  await cleanupAuthUser(admin, userId);
  await supabase.auth.signOut();
}

/**
 * Compensating delete of an orphaned auth user. Deleting the auth user cascades
 * the profile and user_settings rows. Best-effort — a failure is logged.
 */
async function cleanupAuthUser(
  admin: ReturnType<typeof supabaseAdminClient>,
  userId: string,
): Promise<void> {
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    console.error(
      "Registration cleanup failed: orphaned auth user",
      userId,
      error.message,
    );
  }
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

export async function signInAction(
  values: LoginFormValues,
): Promise<AuthActionResult> {
  const schema = buildLoginSchema(await getAuthSchemaMessages());
  const parsed = schema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: await genericError() };
  }

  const supabase = await supabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    // Never reveal whether the email exists — one generic credentials error.
    return { ok: false, error: await authError("invalidCredentials") };
  }

  // Defense against an orphaned auth user (registration cleanup failed): an
  // authenticated user with no profile is not a usable session. Sign back out
  // and surface a clear error rather than landing them on a broken dashboard.
  const user = await getSessionUser();
  if (!user) {
    await supabase.auth.signOut();
    return { ok: false, error: await authError("profileMissing") };
  }

  redirect(await dashboardPath());
}

// ---------------------------------------------------------------------------
// Register (public self-service: signUp → service-role identity rows)
// ---------------------------------------------------------------------------

/**
 * Public student registration.
 *
 * The auth user is created with the **user-initiated `signUp()`** flow (through
 * the cookie-bound server client), *not* `admin.createUser()`. With the project's
 * "Confirm email" disabled, `signUp()` auto-confirms and **establishes the
 * session in one step** — so there is no separate `signInWithPassword`, and the
 * `email_confirm` footgun is gone. It also enforces the platform's signup
 * protections (rate limiting, password policy), which the admin API bypasses.
 *
 * The **service-role client** then performs only the privileged inserts the
 * authenticated user can't do for itself — `profiles` (no INSERT policy; role is
 * server-fixed), `user_settings` (created explicitly so every account is complete
 * — no reliance on a trigger or a future Settings save), and the linked
 * `students` roster row. Any failure rolls the whole registration back.
 *
 * `admin.createUser()` is reserved for **admin provisioning / invitations**
 * (`features/students/identity/actions.ts`), which is the correct use of that API.
 */
export async function signUpAction(
  values: RegisterFormValues,
): Promise<AuthActionResult> {
  const schema = buildRegisterSchema(await getAuthSchemaMessages());
  const parsed = schema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: await genericError() };
  }

  const { fullName, firstNameAr, lastNameAr, email, grade, password } =
    parsed.data;
  const locale = await getLocale();
  const admin = supabaseAdminClient();
  const supabase = await supabaseServerClient();

  // 0. Reconcile by email *before* creating anything. A roster row already
  //    linked to a profile means this email is taken; an unlinked roster row
  //    means a school record exists — we never auto-claim it by email, and the
  //    UNIQUE email constraint forbids a duplicate, so the new account is created
  //    unlinked and the student links it from the onboarding/claim state with
  //    their student_number.
  const rosterRow = await getStudentByEmail(admin, email);
  if (rosterRow && rosterRow.profile_id) {
    return { ok: false, error: await authError("emailTaken") };
  }

  // 1. Create the auth user + session via the public signUp flow.
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (signUpError || !signUpData.user) {
    const isDuplicate =
      signUpError?.code === "user_already_exists" ||
      /already.*registered|already.*exists/i.test(signUpError?.message ?? "");
    return {
      ok: false,
      error: await authError(isDuplicate ? "emailTaken" : "signUpFailed"),
    };
  }

  // Supabase obfuscates an existing-email signup as a user with no identities
  // (and no session) instead of erroring — treat that as "email taken".
  if ((signUpData.user.identities?.length ?? 0) === 0) {
    return { ok: false, error: await authError("emailTaken") };
  }

  const authUserId = signUpData.user.id;

  // With "Confirm email" off, signUp returns a session. If it didn't, the project
  // is requiring confirmation (a config mismatch for Bayan, which has no SMTP) —
  // fail clearly and roll back rather than strand a half-built, unusable account.
  if (!signUpData.session) {
    await cleanupAuthUser(admin, authUserId);
    return { ok: false, error: await authError("signUpFailed") };
  }

  // 2. Create the profile row (service-role — no INSERT policy; role is fixed).
  const { error: profileError } = await admin.from("profiles").insert({
    id: authUserId,
    full_name: fullName,
    role: "student",
    locale,
  });
  if (profileError) {
    await rollbackSignUp(admin, supabase, authUserId);
    return { ok: false, error: await authError("signUpFailed") };
  }

  // 3. Create the user_settings row explicitly so every account is complete from
  //    the start (no trigger, no deferred Settings save). Done via the *session*
  //    client: the just-signed-in user inserts its own row under the existing
  //    `settings_insert_own` RLS (`auth.uid() = user_id`) — no service-role grant
  //    on user_settings is required. Other columns use their schema defaults;
  //    locale mirrors the registration locale.
  const { error: settingsError } = await supabase.from("user_settings").insert({
    user_id: authUserId,
    locale,
  });
  if (settingsError) {
    await rollbackSignUp(admin, supabase, authUserId);
    return { ok: false, error: await authError("signUpFailed") };
  }

  // 4. Create the linked students row — unless a roster row already holds this
  //    email (the collision case), where we leave the account unlinked for the
  //    secure student_number claim.
  if (!rosterRow) {
    try {
      const studentNumber = await generateUniqueStudentNumber(admin);
      const { error: studentError } = await admin.from("students").insert({
        student_number: studentNumber,
        first_name_ar: firstNameAr,
        last_name_ar: lastNameAr,
        email,
        grade: Number(grade),
        profile_id: authUserId,
      });
      if (studentError) {
        // A racing duplicate email (23505) → fall through unlinked (claimable);
        // any other failure → roll the whole registration back.
        if (studentError.code !== "23505") {
          await rollbackSignUp(admin, supabase, authUserId);
          return { ok: false, error: await authError("signUpFailed") };
        }
      }
    } catch {
      await rollbackSignUp(admin, supabase, authUserId);
      return { ok: false, error: await authError("signUpFailed") };
    }
  }

  // 5. Session already established by signUp → straight to the dashboard.
  redirect(await dashboardPath());
}

// ---------------------------------------------------------------------------
// Forgot password (send reset email — always neutral to prevent enumeration)
// ---------------------------------------------------------------------------

export async function requestPasswordResetAction(
  values: ForgotPasswordFormValues,
): Promise<AuthActionResult> {
  const schema = buildForgotPasswordSchema(await getAuthSchemaMessages());
  const parsed = schema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: await genericError() };
  }

  const locale = await getLocale();
  const headerList = await headers();
  // Prefer an explicitly configured site URL; fall back to the request's Origin
  // header (sent on the server-action POST), then to the forwarded host. The
  // resulting URL must be in Supabase's redirect allow-list regardless.
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ??
    headerList.get("origin") ??
    `${headerList.get("x-forwarded-proto") ?? "https"}://${headerList.get("host") ?? ""}`;
  const resetPath = getPathname({ href: ROUTES.resetPassword, locale });
  const redirectTo = `${origin}${ROUTES.authCallback}?next=${encodeURIComponent(resetPath)}`;

  const supabase = await supabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo,
  });

  // Supabase does not reveal whether the address exists, so an error here is a
  // transport/config/rate-limit issue — surface it generically; otherwise the
  // caller shows the same neutral "check your email" state regardless.
  if (error) {
    return { ok: false, error: await genericError() };
  }

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Reset password (requires the active recovery session from the email link)
// ---------------------------------------------------------------------------

export async function updatePasswordAction(
  values: ResetPasswordFormValues,
): Promise<AuthActionResult> {
  const schema = buildResetPasswordSchema(await getAuthSchemaMessages());
  const parsed = schema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: await genericError() };
  }

  const supabase = await supabaseServerClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    const isWeak = error.code === "weak_password";
    return {
      ok: false,
      error: await authError(isWeak ? "weakPassword" : "resetFailed"),
    };
  }

  redirect(await dashboardPath());
}

// ---------------------------------------------------------------------------
// Sign out
// ---------------------------------------------------------------------------

export async function signOutAction(): Promise<void> {
  const supabase = await supabaseServerClient();
  await supabase.auth.signOut();
  const locale = await getLocale();
  redirect(getPathname({ href: ROUTES.login, locale }));
}
