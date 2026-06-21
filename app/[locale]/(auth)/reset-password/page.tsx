import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import { getSessionUser } from "@/features/auth/queries";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { ROUTES } from "@/lib/routes";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("reset.title") };
}

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("auth");

  // Resetting a password requires the recovery session established by the email
  // link (exchanged in `app/api/auth/callback/route.ts`). No session → the link
  // is missing or expired. We deliberately do NOT redirect authenticated users
  // away from this page, so the recovery session can complete the reset.
  const user = await getSessionUser();

  if (!user) {
    return (
      <Card>
        <CardHeader className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t("reset.invalidLinkTitle")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("reset.invalidLinkDescription")}
          </p>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href={ROUTES.forgotPassword}>
              {t("reset.requestNewLink")}
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t("reset.title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("reset.subtitle")}</p>
      </CardHeader>
      <CardContent>
        <ResetPasswordForm />
      </CardContent>
    </Card>
  );
}
