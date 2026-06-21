"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MailCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  requestPasswordResetAction,
  type AuthErrorCopy,
} from "@/features/auth/actions";
import { FormAlert } from "@/features/auth/components/form-alert";
import { TextField } from "@/features/auth/components/text-field";
import { useAuthSchemaMessages } from "@/features/auth/components/use-auth-schema-messages";
import { buildForgotPasswordSchema } from "@/features/auth/schemas";
import type { ForgotPasswordFormValues } from "@/features/auth/types";
import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/lib/routes";

export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const messages = useAuthSchemaMessages();
  const [serverError, setServerError] = useState<AuthErrorCopy | null>(null);
  const [succeeded, setSucceeded] = useState(false);
  const successRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(buildForgotPasswordSchema(messages)),
    defaultValues: { email: "" },
  });

  // When the form is replaced by the success panel, the focused submit button
  // is removed from the DOM. Move focus to the panel so keyboard and screen
  // reader users are not dropped to the document body.
  useEffect(() => {
    if (succeeded) {
      successRef.current?.focus();
    }
  }, [succeeded]);

  async function onSubmit(values: ForgotPasswordFormValues) {
    setServerError(null);
    const result = await requestPasswordResetAction(values);
    if (result.ok) {
      setSucceeded(true);
    } else {
      setServerError(result.error);
    }
  }

  // Neutral success state — shown regardless of whether the address exists, so
  // it never reveals account existence.
  if (succeeded) {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        role="status"
        className="space-y-5 text-center focus-visible:outline-none"
      >
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MailCheck className="size-6" aria-hidden="true" />
        </span>
        <div className="space-y-1.5">
          <h2 className="text-base font-semibold text-foreground">
            {t("forgot.successTitle")}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("forgot.successDescription")}
          </p>
        </div>
        <Button asChild variant="outline" className="w-full">
          <Link href={ROUTES.login}>{t("forgot.backToLogin")}</Link>
        </Button>
      </div>
    );
  }

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
        disabled={isSubmitting}
        registration={register("email")}
      />

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            {t("forgot.submitting")}
          </>
        ) : (
          t("forgot.submit")
        )}
      </Button>

      <div className="text-center">
        <Link
          href={ROUTES.login}
          className="rounded-sm text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {t("forgot.backToLogin")}
        </Link>
      </div>
    </form>
  );
}
