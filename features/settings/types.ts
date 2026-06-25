/**
 * Personal-settings domain & form types (Phase 12).
 *
 * `UserSettingsRecord` is the hand-authored domain type for the `user_settings`
 * table as documented in `.claude/rules/database-schema.md`. `SettingsData` is
 * the resolved, strongly-typed shape the settings form reads (defaults applied
 * for a user with no row yet); `UpdateSettingsFormValues` is the same shape the
 * form submits — these coincide because every setting is a constrained control
 * (no free-text inputs), so there is no string→typed conversion step.
 */

import type { AppLocale } from "@/lib/constants";
import type { Theme } from "@/lib/theme";

/** A row of the `user_settings` table. */
export type UserSettingsRecord = {
  id: string;
  user_id: string;
  theme: string;
  locale: string;
  reduced_motion: boolean;
  email_notifications: boolean;
  created_at: string;
  updated_at: string;
};

/**
 * The four preferences resolved for the form, with the table defaults applied
 * (`theme: "system"`, `locale: "ar"`, `reduced_motion: false`,
 * `email_notifications: true`) when the user has no `user_settings` row yet.
 */
export type SettingsData = {
  theme: Theme;
  locale: AppLocale;
  reduced_motion: boolean;
  email_notifications: boolean;
};

/** The settings-form submission shape — identical to the resolved read shape. */
export type UpdateSettingsFormValues = SettingsData;
