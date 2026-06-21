/**
 * Validated, public Supabase environment access.
 *
 * Only the public (`NEXT_PUBLIC_*`) values live here — they are safe to inline
 * into the browser bundle. The service-role key is intentionally NOT exposed
 * from this module so it can never be imported into client code.
 *
 * The literal `process.env.NEXT_PUBLIC_*` references are required for Next.js to
 * statically inline them; do not refactor them into dynamic lookups.
 */

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Add it to .env.local.`,
    );
  }
  return value;
}

export const SUPABASE_URL = requireEnv(
  "NEXT_PUBLIC_SUPABASE_URL",
  process.env.NEXT_PUBLIC_SUPABASE_URL,
);

export const SUPABASE_ANON_KEY = requireEnv(
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
