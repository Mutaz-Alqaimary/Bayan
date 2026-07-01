"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { AvatarUploader } from "@/features/settings/components/avatar-uploader";
import { useProfileSchemaMessages } from "@/features/settings/components/use-profile-schema-messages";
import { updateProfileAction } from "@/features/settings/profile-actions";
import { buildUpdateProfileSchema } from "@/features/settings/profile-schemas";
import type {
  ProfileData,
  UpdateProfileFormValues,
} from "@/features/settings/profile-types";
import { useRouter } from "@/i18n/navigation";
import { avatarPublicUrl } from "@/lib/avatar";

/**
 * The "Profile" card at the top of Settings (Phase 12.6, Part 1). Lets a user
 * edit **only** their `full_name` (a small Zod-validated form) and avatar
 * (`AvatarUploader`). Email and role are shown **read-only** — email is
 * admin-managed; role changes only through the privileged Teacher-Management
 * action. Both are unwritable by clients at the DB layer regardless of this UI.
 */
export function ProfileCard({ profile }: { profile: ProfileData }) {
  // React Compiler opt-out for THIS component only. React Hook Form's `formState`
  // is a Proxy whose per-key subscription relies on render-time getter reads;
  // compiler memoization caches a stale `isDirty` after the post-save `reset()`,
  // so Save never re-enables until a full reload. Opting just this component out
  // restores the live subscription with no logic change.
  "use no memo";
  const t = useTranslations("settings.profile");
  const messages = useProfileSchemaMessages();
  const router = useRouter();

  const avatarUrl = profile.avatarPath
    ? avatarPublicUrl(profile.avatarPath, profile.avatarVersion)
    : null;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(buildUpdateProfileSchema(messages)),
    defaultValues: { full_name: profile.fullName },
  });

  async function onSubmit(values: UpdateProfileFormValues) {
    const result = await updateProfileAction(values);
    if (!result.ok) {
      toast({
        variant: "destructive",
        title: result.error.title,
        description: result.error.description,
      });
      return;
    }
    toast({ title: t("toasts.savedTitle") });
    reset(values);
    router.refresh();
  }

  return (
    <Card className="space-y-6 p-5 sm:p-6">
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-foreground">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>

      {/* Avatar */}
      <div className="space-y-2">
        <span className="text-sm font-medium text-foreground">
          {t("avatar.label")}
        </span>
        <AvatarUploader avatarUrl={avatarUrl} displayName={profile.fullName} />
      </div>

      {/* Display name */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="profile-full-name">{t("fullName.label")}</Label>
          <Input
            id="profile-full-name"
            {...register("full_name")}
            autoComplete="name"
            aria-invalid={errors.full_name ? true : undefined}
            aria-describedby={
              errors.full_name ? "profile-full-name-error" : undefined
            }
          />
          {errors.full_name ? (
            <p
              id="profile-full-name-error"
              className="text-sm text-destructive-text"
            >
              {errors.full_name.message}
            </p>
          ) : null}
        </div>

        {/* Read-only context: email + role */}
        <div className="grid gap-4 sm:grid-cols-2">
          <ReadOnlyField label={t("email.label")} hint={t("email.hint")}>
            <span dir="ltr" className="truncate">
              {profile.email ?? "—"}
            </span>
          </ReadOnlyField>
          <ReadOnlyField label={t("role.label")} hint={t("role.hint")}>
            {t(`roles.${profile.role}`)}
          </ReadOnlyField>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSubmitting || !isDirty}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
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
    </Card>
  );
}

/** A labeled, read-only field rendered as a disabled-looking value box. */
function ReadOnlyField({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="flex h-9 items-center rounded-md border border-input bg-muted/40 px-3 text-sm text-muted-foreground">
        <span className="truncate">{children}</span>
      </div>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
