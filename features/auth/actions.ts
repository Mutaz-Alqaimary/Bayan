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
  type AuthSchemaMessages,
} from "@/features/auth/schemas";
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
// Register (atomic: create user → create profile → sign in)
// ---------------------------------------------------------------------------

export async function signUpAction(
  values: RegisterFormValues,
): Promise<AuthActionResult> {
  const schema = buildRegisterSchema(await getAuthSchemaMessages());
  const parsed = schema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: await genericError() };
  }

  const { fullName, email, password } = parsed.data;
  const locale = await getLocale();
  const admin = supabaseAdminClient();

  // 1. Create the auth user (email confirmation is off → confirm immediately).
  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

  if (createError || !created.user) {
    // `code` is the reliable signal; the message check is a defensive fallback.
    // A bare `status === 422` is deliberately NOT treated as duplicate — it is a
    // generic "unprocessable" Supabase also returns for other create failures.
    const isDuplicate =
      createError?.code === "email_exists" ||
      /already.*registered|already.*exists/i.test(createError?.message ?? "");
    return {
      ok: false,
      error: await authError(isDuplicate ? "emailTaken" : "signUpFailed"),
    };
  }

  // 2. Create the profile row. Role is hard-coded — never taken from input.
  const { error: profileError } = await admin.from("profiles").insert({
    id: created.user.id,
    full_name: fullName,
    role: "student",
    locale,
  });

  if (profileError) {
    // 2a. Compensating action: undo the orphaned auth user so registration is
    // atomic and the email is freed for a clean retry. Best-effort — if the
    // delete itself fails it is logged; the login boundary still refuses a
    // profile-less session.
    const { error: cleanupError } = await admin.auth.admin.deleteUser(
      created.user.id,
    );
    if (cleanupError) {
      console.error(
        "Registration cleanup failed: orphaned auth user",
        created.user.id,
        cleanupError.message,
      );
    }
    return { ok: false, error: await authError("signUpFailed") };
  }

  // 3. Establish the cookie session only after user + profile both exist.
  const supabase = await supabaseServerClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  // The account and profile now both exist. If this immediate sign-in fails,
  // send the user to login to sign in manually — dead-ending on a "couldn't
  // create your account" error would be misleading, since a retry would now hit
  // `emailTaken`.
  if (signInError) {
    redirect(getPathname({ href: ROUTES.login, locale }));
  }

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
