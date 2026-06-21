import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/env";

/**
 * Server-side Supabase client, bound to the current request's cookies.
 * Use inside Server Components, Server Actions, and Route Handlers.
 *
 * Always call this per request (it reads `cookies()`); never cache the returned
 * client across requests.
 */
export async function supabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // `setAll` was called from a Server Component, where cookies are
          // read-only. Safe to ignore: the proxy refreshes the session and
          // writes the cookies on every request.
        }
      },
    },
  });
}
