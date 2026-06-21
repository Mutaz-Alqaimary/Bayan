import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

/**
 * Locale-scoped 404. Rendered inside the locale layout, so it inherits the
 * correct `dir`, fonts, theme, and translated copy.
 */
export default function NotFound() {
  const t = useTranslations("notFound");

  return (
    <main
      id="main-content"
      className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center"
    >
      <p className="text-5xl font-bold tracking-tight text-primary">
        {t("code")}
      </p>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        {t("title")}
      </h1>
      <p className="max-w-md text-muted-foreground">{t("description")}</p>
      <Link
        href="/"
        className="mt-2 inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {t("back")}
      </Link>
    </main>
  );
}
