"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  signInAction,
  type AuthErrorCopy,
} from "@/features/auth/actions";
import { FormAlert } from "@/features/auth/components/form-alert";
import { PasswordField } from "@/features/auth/components/password-field";
import { TextField } from "@/features/auth/components/text-field";
import { useAuthSchemaMessages } from "@/features/auth/components/use-auth-schema-messages";
import { buildLoginSchema } from "@/features/auth/schemas";
import type { LoginFormValues } from "@/features/auth/types";
import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/lib/routes";

export function LoginForm() {
  const t = useTranslations("auth");
  const messages = useAuthSchemaMessages();
  const [serverError, setServerError] = useState<AuthErrorCopy | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(buildLoginSchema(messages)),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    setServerError(null);
    const result = await signInAction(values);
    // Failures return here; a successful sign-in redirects server-side, so we
    // keep the form visibly pending through navigation rather than letting it
    // snap back to idle.
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

      <div className="space-y-2">
        <PasswordField
          id="password"
          label={t("fields.password")}
          autoComplete="current-password"
          placeholder={t("fields.passwordPlaceholder")}
          error={errors.password?.message}
          disabled={pending}
          showLabel={t("fields.showPassword")}
          hideLabel={t("fields.hidePassword")}
          registration={register("password")}
        />
        <div className="flex justify-end">
          <Link
            href={ROUTES.forgotPassword}
            className="rounded-sm text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {t("login.forgotPassword")}
          </Link>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={pending}
        aria-busy={pending}
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            {t("login.submitting")}
          </>
        ) : (
          t("login.submit")
        )}
      </Button>
    </form>
  );
}
