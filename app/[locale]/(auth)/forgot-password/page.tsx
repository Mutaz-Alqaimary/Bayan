import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";
import { redirectIfAuthenticated } from "@/features/auth/guards";
import type { AppLocale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("forgot.title") };
}

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await redirectIfAuthenticated();

  const t = await getTranslations("auth");

  return (
    <Card>
      <CardHeader className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t("forgot.title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("forgot.subtitle")}</p>
      </CardHeader>
      <CardContent>
        <ForgotPasswordForm />
      </CardContent>
    </Card>
  );
}
