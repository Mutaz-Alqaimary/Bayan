import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/env";

/**
 * Refreshes the Supabase auth session during the proxy pass and writes any
 * rotated auth cookies onto the provided response.
 *
 * It reuses the response produced by the i18n middleware so a single response
 * carries both the locale cookie and the refreshed auth cookies.
 *
 * IMPORTANT: do not run other logic between creating the client and calling
 * `getUser()` — that call is what triggers the token refresh and `setAll`.
 */
export async function updateSession(
  request: NextRequest,
  response: NextResponse,
): Promise<NextResponse> {
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  await supabase.auth.getUser();

  return response;
}
