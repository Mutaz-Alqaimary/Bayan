import { requireEnv } from "@/lib/supabase/env";

/**
 * Startup environment fail-fast (Phase 19).
 *
 * Next.js calls `register()` exactly once when a server instance boots (both
 * `next dev` and `next start`). We use it to assert that every required
 * environment variable is present, so a misconfigured deployment fails loudly
 * at startup instead of silently at the first request that needs it.
 *
 * - The public `NEXT_PUBLIC_SUPABASE_*` vars are already validated at import
 *   time inside `lib/supabase/env.ts` (they throw if missing). Importing
 *   `requireEnv` from there evaluates that module, so those two are covered at
 *   startup as a side effect — their handling is intentionally left unchanged.
 * - `SUPABASE_SERVICE_ROLE_KEY` is otherwise only checked lazily inside
 *   `supabaseAdminClient()`, so we assert it explicitly here to bring it under
 *   the same fail-fast guarantee. It stays server-only (validated only in the
 *   Node.js runtime) and is never read into a client-importable module.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  requireEnv("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY);
}
