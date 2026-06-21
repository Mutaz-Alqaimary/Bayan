import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";

import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Next.js 16 renamed Middleware to Proxy (same functionality, clearer name).
 *
 * Each request runs two concerns, in order, sharing a single response:
 *   1. next-intl locale routing — redirects `/` to the default locale (`/ar`),
 *      validates/negotiates the locale prefix, and maintains the locale cookie.
 *   2. Supabase session refresh — rotates the auth tokens and writes the
 *      refreshed auth cookies onto the same response.
 */
const handleI18nRouting = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  const response = handleI18nRouting(request);
  return updateSession(request, response);
}

export const config = {
  // Match all pathnames except for Next.js internals, API routes, and files
  // with an extension (e.g. /favicon.ico, /images/logo.svg).
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
