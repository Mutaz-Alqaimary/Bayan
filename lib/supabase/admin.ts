import "server-only";

import { createClient } from "@supabase/supabase-js";

import { SUPABASE_URL } from "@/lib/supabase/env";

/**
 * Server-only Supabase client authenticated with the **service-role key**.
 *
 * This client **bypasses Row Level Security**. It must only ever be used inside
 * server-only code (Server Actions / Route Handlers) to perform an explicitly
 * authorized, server-validated operation — never to proxy arbitrary client
 * input. The `import "server-only"` guard makes bundling it into client code a
 * build error.
 *
 * In Phase 5 its sole use is atomic registration (`features/auth/actions.ts`):
 * creating the auth user and inserting the `profiles` row (the schema has no
 * `profiles` INSERT policy and no signup trigger — see `SupabaseArchitecture.md`).
 *
 * The service-role key is read directly from the environment here, never via
 * `lib/supabase/env.ts`, so it can never reach a client-importable module.
 * `persistSession`/`autoRefreshToken` are disabled because this client is
 * stateless and must not touch the request's auth cookies.
 */
export function supabaseAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      "Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY. Add it to .env.local.",
    );
  }

  return createClient(SUPABASE_URL, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
