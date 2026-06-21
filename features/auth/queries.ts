import "server-only";

import { isUserRole } from "@/features/auth/roles";
import type { ProfileRecord, SessionUser } from "@/features/auth/types";
import { supabaseServerClient } from "@/lib/supabase/server";

/**
 * Resolve the current authenticated user joined with their profile, or `null`.
 *
 * Uses `auth.getUser()` (which validates the token against the Supabase Auth
 * server) rather than `getSession()` (which trusts the unverified cookie), per
 * Supabase's security guidance. The role is validated at runtime before being
 * trusted as a `UserRole`.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await supabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "id, full_name, role, avatar_url, locale, created_at, updated_at",
    )
    .eq("id", user.id)
    .single<ProfileRecord>();

  if (profileError || !profile || !isUserRole(profile.role)) {
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? null,
    role: profile.role,
    profile,
  };
}
