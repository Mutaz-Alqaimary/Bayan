"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  updatePasswordAction,
  type AuthErrorCopy,
} from "@/features/auth/actions";
import { FormAlert } from "@/features/auth/components/form-alert";
import { PasswordField } from "@/features/auth/components/password-field";
import { useAuthSchemaMessages } from "@/features/auth/components/use-auth-schema-messages";
import { buildResetPasswordSchema } from "@/features/auth/schemas";
import type { ResetPasswordFormValues } from "@/features/auth/types";

export function ResetPasswordForm() {
  const t = useTranslations("auth");
  const messages = useAuthSchemaMessages();
  const [serverError, setServerError] = useState<AuthErrorCopy | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(buildResetPasswordSchema(messages)),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: ResetPasswordFormValues) {
    setServerError(null);
    const result = await updatePasswordAction(values);
    // Failures return here; a successful update redirects server-side, so keep
    // the form pending through navigation.
    if (result && !result.ok) {
      setServerError(result.error);
      return;
    }
    setIsRedirecting(true);
  }

  const pending = isSubmitting || isRedirecting;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {serverError ? (
        <FormAlert
          title={serverError.title}
          description={serverError.description}
        />
      ) : null}

      <PasswordField
        id="password"
        label={t("fields.newPassword")}
        autoComplete="new-password"
        placeholder={t("fields.passwordPlaceholder")}
        error={errors.password?.message}
        disabled={pending}
        showLabel={t("fields.showPassword")}
        hideLabel={t("fields.hidePassword")}
        registration={register("password")}
      />

      <PasswordField
        id="confirmPassword"
        label={t("fields.confirmPassword")}
        autoComplete="new-password"
        placeholder={t("fields.confirmPasswordPlaceholder")}
        error={errors.confirmPassword?.message}
        disabled={pending}
        showLabel={t("fields.showPassword")}
        hideLabel={t("fields.hidePassword")}
        registration={register("confirmPassword")}
      />

      <Button
        type="submit"
        className="w-full"
        disabled={pending}
        aria-busy={pending}
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            {t("reset.submitting")}
          </>
        ) : (
          t("reset.submit")
        )}
      </Button>
    </form>
  );
}
