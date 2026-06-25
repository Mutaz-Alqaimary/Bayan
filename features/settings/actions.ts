"use server";

import { getLocale, getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";

import { requireUser } from "@/features/auth/guards";
import {
  buildUpdateSettingsSchema,
  type UpdateSettingsMessages,
} from "@/features/settings/schemas";
import type { UpdateSettingsFormValues } from "@/features/settings/types";
import { ROUTES } from "@/lib/routes";
import { supabaseServerClient } from "@/lib/supabase/server";

/**
 * Update the signed-in user's personal settings (Phase 12).
 *
 * Any authenticated user (all roles manage their own settings). Re-validates
 * the four constrained fields, then **upserts** the `user_settings` row keyed by
 * `user_id` (insert on first save, update thereafter) through the **session
 * client only** — `settings_insert_own`/`settings_update_own` enforce
 * `auth.uid() = user_id`, so a user can only ever write their own row, and no
 * service-role escalation is used.
 */

export type SettingsErrorCopy = { title: string; description: string };

export type UpdateSettingsResult =
  | { ok: true }
  | { ok: false; error: SettingsErrorCopy };

async function genericError(): Promise<SettingsErrorCopy> {
  const t = await getTranslations("errors");
  return { title: t("generic.title"), description: t("generic.description") };
}

async function getSettingsMessages(): Promise<UpdateSettingsMessages> {
  const t = await getTranslations("settings.validation");
  return { invalid: t("invalid") };
}

export async function updateSettingsAction(
  values: UpdateSettingsFormValues,
): Promise<UpdateSettingsResult> {
  const user = await requireUser();

  const schema = buildUpdateSettingsSchema(await getSettingsMessages());
  const parsed = schema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: await genericError() };
  }

  const supabase = await supabaseServerClient();
  const { error } = await supabase.from("user_settings").upsert(
    {
      user_id: user.id,
      theme: parsed.data.theme,
      locale: parsed.data.locale,
      reduced_motion: parsed.data.reduced_motion,
      email_notifications: parsed.data.email_notifications,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    // A missing GRANT/policy surfaces as 42501 — log it distinctly, but never
    // escalate to the service-role client (data-layer authorization stands).
    if (error.code === "42501") {
      console.error(
        "user_settings upsert blocked by RLS/GRANT (42501). Verify authenticated has SELECT/INSERT/UPDATE on user_settings and the settings_*_own policies exist.",
      );
    }
    return { ok: false, error: await genericError() };
  }

  const locale = await getLocale();
  revalidatePath(`/${locale}${ROUTES.settings}`);
  revalidatePath(`/${locale}${ROUTES.dashboard}`);
  return { ok: true };
}
