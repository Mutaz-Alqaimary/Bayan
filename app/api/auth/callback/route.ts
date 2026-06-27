import { NextResponse, type NextRequest } from "next/server";

import { DEFAULT_LOCALE, LOCALES } from "@/lib/constants";
import { ROUTES } from "@/lib/routes";
import { supabaseServerClient } from "@/lib/supabase/server";

/**
 * Auth callback for recovery / activation links. Supports **two** flows, both of
 * which establish a session (setting the auth cookies via the server client's
 * cookie adapter) and then forward to the localized page carried in `next`:
 *
 *  1. **PKCE (`?code=`)** — user-initiated password reset (Phase 5
 *     `resetPasswordForEmail`). The code verifier lives in the requesting
 *     browser, so `exchangeCodeForSession(code)` completes the exchange.
 *
 *  2. **Token hash (`?token_hash=&type=recovery`)** — admin-generated student
 *     activation links (Phase 12.6 `generateStudentActivationLinkAction`). Those
 *     are created server-side via the Admin API, so there is **no PKCE verifier**
 *     in the student's browser and the default `/auth/v1/verify` → `?code`
 *     exchange can't work (it returns tokens in the URL hash a server route can't
 *     read). We instead pass the link's `hashed_token` here and verify it
 *     server-side with `verifyOtp`, which needs no verifier.
 *
 * Lives under `/api` so the next-intl proxy (which prefixes every page route with
 * a locale) leaves this backend endpoint untouched.
 */

/** Email OTP types accepted on the token-hash path (`verifyOtp({ token_hash })`). */
const EMAIL_OTP_TYPES = [
  "recovery",
  "invite",
  "magiclink",
  "signup",
  "email_change",
  "email",
] as const;

function isEmailOtpType(
  value: string | null,
): value is (typeof EMAIL_OTP_TYPES)[number] {
  return value !== null && (EMAIL_OTP_TYPES as readonly string[]).includes(value);
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next");

  // Only ever redirect to an internal, single-leading-slash path.
  const safeNext =
    next && next.startsWith("/") && !next.startsWith("//")
      ? next
      : ROUTES.home;

  const supabase = await supabaseServerClient();

  // 1. PKCE flow (user-initiated password reset).
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(safeNext, origin));
    }
  }
  // 2. Token-hash flow (admin-generated activation link — no PKCE verifier).
  else if (tokenHash && isEmailOtpType(type)) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) {
      return NextResponse.redirect(new URL(safeNext, origin));
    }
  }

  // Missing or invalid credentials: send to login. The reset page would
  // otherwise show its own "expired link" state, but without a session there is
  // nothing to reset, so login is the correct destination. Recover the locale
  // from the `next` path so we land on the localized login directly (no proxy
  // re-redirect and no silent drop to the default locale).
  const maybeLocale = safeNext.split("/").filter(Boolean)[0];
  const locale = (LOCALES as readonly string[]).includes(maybeLocale ?? "")
    ? maybeLocale
    : DEFAULT_LOCALE;
  return NextResponse.redirect(new URL(`/${locale}${ROUTES.login}`, origin));
}
