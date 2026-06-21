import { NextResponse, type NextRequest } from "next/server";

import { DEFAULT_LOCALE, LOCALES } from "@/lib/constants";
import { ROUTES } from "@/lib/routes";
import { supabaseServerClient } from "@/lib/supabase/server";

/**
 * Auth callback for the password-reset (recovery) email link.
 *
 * Supabase sends the user here with a one-time `code`; we exchange it for a
 * session (which sets the auth cookies via the server client's cookie adapter),
 * then forward them to the localized reset-password page carried in `next`.
 *
 * Lives under `/api` so the next-intl proxy — which prefixes every page route
 * with a locale — leaves this backend endpoint untouched. It is not cached
 * (Route Handlers aren't by default) since it always reads the request.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  // Only ever redirect to an internal, single-leading-slash path.
  const safeNext =
    next && next.startsWith("/") && !next.startsWith("//")
      ? next
      : ROUTES.home;

  if (code) {
    const supabase = await supabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(safeNext, origin));
    }
  }

  // Missing or invalid code: send to login. The reset page would otherwise
  // show its own "expired link" state, but without a session there is nothing
  // to reset, so login is the correct destination. Recover the locale from the
  // `next` path so we land on the localized login directly (no proxy re-redirect
  // and no silent drop to the default locale).
  const maybeLocale = safeNext.split("/").filter(Boolean)[0];
  const locale = (LOCALES as readonly string[]).includes(maybeLocale ?? "")
    ? maybeLocale
    : DEFAULT_LOCALE;
  return NextResponse.redirect(new URL(`/${locale}${ROUTES.login}`, origin));
}
