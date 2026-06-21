import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LoginForm } from "@/features/auth/components/login-form";
import { redirectIfAuthenticated } from "@/features/auth/guards";
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
  return { title: t("login.title") };
}

export default async function LoginPage({
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
          {t("login.title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("login.subtitle")}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <LoginForm />
        <p className="text-center text-sm text-muted-foreground">
          {t("login.noAccount")}{" "}
          <Link
            href={ROUTES.register}
            className="rounded-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {t("login.registerLink")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
