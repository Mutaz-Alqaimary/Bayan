"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Bell,
  Loader2,
  Monitor,
  Moon,
  Sparkles,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSyncExternalStore, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";

import { useReducedMotion } from "@/components/providers/motion-provider";
import { useTheme } from "@/components/providers/theme-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { updateSettingsAction } from "@/features/settings/actions";
import { ProfileCard } from "@/features/settings/components/profile-card";
import { useSettingsSchemaMessages } from "@/features/settings/components/use-settings-schema-messages";
import type { ProfileData } from "@/features/settings/profile-types";
import { buildUpdateSettingsSchema } from "@/features/settings/schemas";
import type {
  SettingsData,
  UpdateSettingsFormValues,
} from "@/features/settings/types";
import { usePathname, useRouter } from "@/i18n/navigation";
import { LOCALE_LABELS, LOCALES, type AppLocale } from "@/lib/constants";
import { type Theme } from "@/lib/theme";

/** Theme options with their icons, in the order shown. */
const THEME_OPTIONS: { value: Theme; icon: LucideIcon }[] = [
  { value: "light", icon: Sun },
  { value: "dark", icon: Moon },
  { value: "system", icon: Monitor },
];

const emptySubscribe = () => () => {};

/**
 * `false` during SSR and the first client render, `true` after mount — without a
 * `setState`-in-effect. The theme and reduced-motion controls reflect client-only
 * state (the applied per-device preference from `localStorage`), which the server
 * can't know; gating their render on this avoids a hydration mismatch while the
 * `useSyncExternalStore` contract guarantees the post-hydration flip is safe.
 */
function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

/**
 * The personal-settings form (Phase 12). One Zod-validated form over the four
 * `user_settings` preferences. Theme and reduced motion apply **immediately**
 * (live preview via their providers) so the change is felt app-wide before
 * saving; locale is applied on save by navigating to the chosen locale. Saving
 * upserts the row; the active locale and the live theme/motion providers are the
 * source of truth for what the user currently sees, so the form is seeded from
 * them (and `email_notifications` from the persisted row).
 *
 * Theme and reduced motion are client-only (read from `localStorage` before
 * paint), so their controls render only after mount (`useMounted`) — otherwise
 * the server's default-seeded radio/switch would mismatch the client's stored
 * value on hydration.
 */
export function SettingsPage({
  settings,
  profile,
}: {
  settings: SettingsData;
  profile: ProfileData;
}) {
  const t = useTranslations("settings");
  const messages = useSettingsSchemaMessages();
  const { theme, setTheme } = useTheme();
  const { reducedMotion, setReducedMotion } = useReducedMotion();
  const activeLocale = useLocale() as AppLocale;
  const mounted = useMounted();
  const router = useRouter();
  const pathname = usePathname();
  const [isNavigating, startNavigation] = useTransition();

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, isSubmitting },
  } = useForm<UpdateSettingsFormValues>({
    resolver: zodResolver(buildUpdateSettingsSchema(messages)),
    defaultValues: {
      theme,
      locale: activeLocale,
      reduced_motion: reducedMotion,
      email_notifications: settings.email_notifications,
    },
  });

  async function onSubmit(values: UpdateSettingsFormValues) {
    const result = await updateSettingsAction(values);
    if (!result.ok) {
      toast({
        variant: "destructive",
        title: result.error.title,
        description: result.error.description,
      });
      return;
    }

    toast({
      title: t("toasts.savedTitle"),
      description: t("toasts.savedDescription"),
    });

    if (values.locale !== activeLocale) {
      // Locale takes effect by switching the active locale (URL + cookie); the
      // destination page re-reads the just-saved settings.
      startNavigation(() => router.replace(pathname, { locale: values.locale }));
      return;
    }

    // Clear the dirty baseline so Save disables until the next change.
    reset(values);
    router.refresh();
  }

  const pending = isSubmitting || isNavigating;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </header>

      {/* Profile — full name + avatar (separate form/data source from preferences) */}
      <ProfileCard profile={profile} />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        {/* Appearance — theme */}
        <Card className="space-y-4 p-5 sm:p-6">
          <div className="space-y-1">
            <h2
              id="settings-theme-label"
              className="text-base font-semibold text-foreground"
            >
              {t("appearance.title")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("appearance.description")}
            </p>
          </div>
          {!mounted ? (
            <div
              className="grid gap-3 sm:grid-cols-3"
              aria-hidden="true"
            >
              {THEME_OPTIONS.map(({ value }) => (
                <Skeleton key={value} className="h-13 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <Controller
              control={control}
              name="theme"
              render={({ field }) => (
                <RadioGroup
                  aria-labelledby="settings-theme-label"
                  value={field.value}
                  onValueChange={(value) => {
                    const next = value as Theme;
                    setTheme(next); // live preview, app-wide
                    field.onChange(next);
                  }}
                  className="sm:grid-cols-3"
                >
                  {THEME_OPTIONS.map(({ value, icon: Icon }) => {
                  const id = `theme-${value}`;
                  const selected = field.value === value;
                  return (
                    <label
                      key={value}
                      htmlFor={id}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                        selected
                          ? "border-primary bg-primary/10 ring-1 ring-primary"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <RadioGroupItem
                        id={id}
                        value={value}
                        aria-labelledby={`${id}-label`}
                      />
                      <Icon
                        className={`size-4 ${selected ? "text-primary" : "text-muted-foreground"}`}
                        aria-hidden="true"
                      />
                      <span
                        id={`${id}-label`}
                        className="text-sm font-medium text-foreground"
                      >
                        {t(`appearance.themes.${value}`)}
                      </span>
                    </label>
                  );
                })}
                </RadioGroup>
              )}
            />
          )}
        </Card>

        {/* Language — locale */}
        <Card className="space-y-4 p-5 sm:p-6">
          <div className="space-y-1">
            <h2
              id="settings-locale-label"
              className="text-base font-semibold text-foreground"
            >
              {t("language.title")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("language.description")}
            </p>
          </div>
          <Controller
            control={control}
            name="locale"
            render={({ field }) => (
              <RadioGroup
                aria-labelledby="settings-locale-label"
                value={field.value}
                onValueChange={(value) => field.onChange(value as AppLocale)}
                className="sm:grid-cols-2"
              >
                {LOCALES.map((value) => {
                  const id = `locale-${value}`;
                  const selected = field.value === value;
                  return (
                    <label
                      key={value}
                      htmlFor={id}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                        selected
                          ? "border-primary bg-primary/10 ring-1 ring-primary"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <RadioGroupItem
                        id={id}
                        value={value}
                        aria-labelledby={`${id}-label`}
                      />
                      <span
                        id={`${id}-label`}
                        lang={value}
                        className="text-sm font-medium text-foreground"
                      >
                        {LOCALE_LABELS[value]}
                      </span>
                    </label>
                  );
                })}
              </RadioGroup>
            )}
          />
        </Card>

        {/* Accessibility — reduced motion */}
        <Card className="space-y-4 p-5 sm:p-6">
          <h2 className="text-base font-semibold text-foreground">
            {t("accessibility.title")}
          </h2>
          <Controller
            control={control}
            name="reduced_motion"
            render={({ field }) => (
              <SwitchRow
                id="settings-reduced-motion"
                icon={
                  <Sparkles
                    className="size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                }
                title={t("accessibility.reducedMotion.title")}
                description={t("accessibility.reducedMotion.description")}
                checked={field.value}
                ready={mounted}
                onCheckedChange={(next) => {
                  setReducedMotion(next); // live preview, app-wide
                  field.onChange(next);
                }}
              />
            )}
          />
        </Card>

        {/* Notifications — email */}
        <Card className="space-y-4 p-5 sm:p-6">
          <h2 className="text-base font-semibold text-foreground">
            {t("notifications.title")}
          </h2>
          <Controller
            control={control}
            name="email_notifications"
            render={({ field }) => (
              <SwitchRow
                id="settings-email-notifications"
                icon={
                  <Bell
                    className="size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                }
                title={t("notifications.email.title")}
                description={t("notifications.email.description")}
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={pending || !isDirty} aria-busy={pending}>
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                {t("saving")}
              </>
            ) : (
              t("save")
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

/**
 * A labeled switch row: icon + title + description on the start, switch at the
 * end. `ready` gates the switch's checked state for client-only preferences
 * (e.g. reduced motion, read from `localStorage`): until mounted it shows a
 * placeholder so the server-default checked value can't mismatch on hydration.
 */
function SwitchRow({
  id,
  icon,
  title,
  description,
  checked,
  onCheckedChange,
  ready = true,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  ready?: boolean;
}) {
  const labelId = `${id}-label`;
  const descriptionId = `${id}-description`;
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5">{icon}</span>
        <div className="space-y-0.5">
          {/* `aria-labelledby`/`aria-describedby` on the Switch carry the name and
              description: a Radix Switch renders a `role="switch"` button, which a
              `<label htmlFor>` does not reliably name. `htmlFor` is kept for the
              pointer click-to-toggle affordance. */}
          <label
            id={labelId}
            htmlFor={id}
            className="text-sm font-medium text-foreground"
          >
            {title}
          </label>
          <p id={descriptionId} className="text-sm text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      {ready ? (
        <Switch
          id={id}
          checked={checked}
          onCheckedChange={onCheckedChange}
          aria-labelledby={labelId}
          aria-describedby={descriptionId}
        />
      ) : (
        <Skeleton className="h-5 w-9 rounded-full" aria-hidden="true" />
      )}
    </div>
  );
}
