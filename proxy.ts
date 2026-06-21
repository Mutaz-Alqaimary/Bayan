import createMiddleware from "next-intl/middleware";

import { routing } from "@/i18n/routing";

/**
 * Next.js 16 renamed Middleware to Proxy (same functionality, clearer name).
 * This proxy delegates to next-intl so that:
 *   - `/` redirects to the default locale (`/ar`)
 *   - locale prefixes are validated and negotiated from the request
 *   - a locale cookie is maintained across navigations
 */
export const proxy = createMiddleware(routing);

export const config = {
  // Match all pathnames except for Next.js internals, API routes, and files
  // with an extension (e.g. /favicon.ico, /images/logo.svg).
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
