"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  signUpAction,
  type AuthErrorCopy,
} from "@/features/auth/actions";
import { FormAlert } from "@/features/auth/components/form-alert";
import { PasswordField } from "@/features/auth/components/password-field";
import { TextField } from "@/features/auth/components/text-field";
import { useAuthSchemaMessages } from "@/features/auth/components/use-auth-schema-messages";
import { buildRegisterSchema } from "@/features/auth/schemas";
import type { RegisterFormValues } from "@/features/auth/types";

export function RegisterForm() {
  const t = useTranslations("auth");
  const messages = useAuthSchemaMessages();
  const [serverError, setServerError] = useState<AuthErrorCopy | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(buildRegisterSchema(messages)),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: RegisterFormValues) {
    setServerError(null);
    const result = await signUpAction(values);
    // Failures return here; a successful registration signs in and redirects
    // server-side, so keep the form pending through navigation.
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

      <TextField
        id="fullName"
        label={t("fields.fullName")}
        autoComplete="name"
        placeholder={t("fields.fullNamePlaceholder")}
        error={errors.fullName?.message}
        disabled={pending}
        registration={register("fullName")}
      />

      <TextField
        id="email"
        label={t("fields.email")}
        type="email"
        inputMode="email"
        autoComplete="email"
        dir="ltr"
        placeholder={t("fields.emailPlaceholder")}
        error={errors.email?.message}
        disabled={pending}
        registration={register("email")}
      />

      <PasswordField
        id="password"
        label={t("fields.password")}
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
            {t("register.submitting")}
          </>
        ) : (
          t("register.submit")
        )}
      </Button>
    </form>
  );
}
