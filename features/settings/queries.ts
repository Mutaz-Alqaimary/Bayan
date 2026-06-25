import "server-only";

import type { SettingsData } from "@/features/settings/types";
import { DEFAULT_LOCALE, LOCALES, type AppLocale } from "@/lib/constants";
import { supabaseServerClient } from "@/lib/supabase/server";
import { DEFAULT_THEME, THEMES, type Theme } from "@/lib/theme";

/**
 * Server-only read for a user's personal settings (Phase 12).
 *
 * Scoped to the signed-in user's own `user_settings` row via `user_id`, read
 * under the request's RLS-respecting session client (`settings_select_own`
 * enforces `auth.uid() = user_id`). A user with no row yet (none is created at
 * registration) returns the table defaults, so the form always has a coherent
 * starting state and the first save inserts the row.
 */

const SETTINGS_COLUMNS = "theme, locale, reduced_motion, email_notifications";

type SettingsRow = {
  theme: string;
  locale: string;
  reduced_motion: boolean;
  email_notifications: boolean;
};

/** Coerce a stored theme string to the `Theme` union, defaulting if unknown. */
function normalizeTheme(value: string): Theme {
  return (THEMES as readonly string[]).includes(value)
    ? (value as Theme)
    : DEFAULT_THEME;
}

/** Coerce a stored locale string to the `AppLocale` union, defaulting if unknown. */
function normalizeLocale(value: string): AppLocale {
  return (LOCALES as readonly string[]).includes(value)
    ? (value as AppLocale)
    : DEFAULT_LOCALE;
}

/** The signed-in user's settings, or the table defaults when no row exists. */
export async function getUserSettings(userId: string): Promise<SettingsData> {
  const supabase = await supabaseServerClient();
  const { data, error } = await supabase
    .from("user_settings")
    .select(SETTINGS_COLUMNS)
    .eq("user_id", userId)
    .maybeSingle<SettingsRow>();

  if (error) {
    throw new Error(`Failed to load settings: ${error.message}`);
  }

  if (!data) {
    return {
      theme: DEFAULT_THEME,
      locale: DEFAULT_LOCALE,
      reduced_motion: false,
      email_notifications: true,
    };
  }

  return {
    theme: normalizeTheme(data.theme),
    locale: normalizeLocale(data.locale),
    reduced_motion: data.reduced_motion,
    email_notifications: data.email_notifications,
  };
}
