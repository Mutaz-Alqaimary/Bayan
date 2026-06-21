import { createBrowserClient } from "@supabase/ssr";

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/env";

/**
 * Browser-side Supabase client (singleton). Use this only inside Client
 * Components. `createBrowserClient` manages auth state via cookies that the
 * proxy keeps in sync on every request.
 *
 * For Server Components, Server Actions, and Route Handlers use
 * `supabaseServerClient()` from `@/lib/supabase/server` instead.
 */
export const supabaseClient = createBrowserClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
);
