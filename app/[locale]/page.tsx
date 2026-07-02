import {
  ArrowLeft,
  ArrowRight,
  Check,
  Gauge,
  Languages,
  Target,
  TrendingUp,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SkipLink } from "@/components/layout/skip-link";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { ROUTES } from "@/lib/routes";

const metrics = [
  { key: "speed", Icon: Gauge },
  { key: "accuracy", Icon: Target },
  { key: "vocabulary", Icon: Languages },
  { key: "progress", Icon: TrendingUp },
] as const;

const foundationItems = ["rtl", "i18n", "theme", "a11y"] as const;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("home");
  // The forward-pointing CTA arrow must follow reading direction.
  const ForwardArrow = locale === "ar" ? ArrowLeft : ArrowRight;

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SkipLink />
      <SiteHeader />

      <main id="main-content" className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-72 max-w-4xl rounded-full bg-primary/10 blur-3xl"
          />
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                {t("hero.eyebrow")}
              </span>
              <h1 className="mt-6 text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                {t("hero.title")}
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
                {t("hero.subtitle")}
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href={ROUTES.register}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {t("hero.ctaPrimary")}
                  <ForwardArrow className="size-4" aria-hidden="true" />
                </Link>
                <a
                  href="#metrics"
                  className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-background px-6 text-sm font-semibold text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {t("hero.ctaSecondary")}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* What Bayan measures */}
        <section
          id="metrics"
          aria-labelledby="metrics-heading"
          className="scroll-mt-20 border-t border-border/60 bg-muted/30"
        >
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <h2
              id="metrics-heading"
              className="text-center text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
            >
              {t("metrics.title")}
            </h2>
            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {metrics.map(({ key, Icon }) => (
                <div
                  key={key}
                  className="group rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-card-foreground">
                    {t(`metrics.items.${key}.title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {t(`metrics.items.${key}.description`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Foundation */}
        <section
          id="foundation"
          aria-labelledby="foundation-heading"
          className="scroll-mt-20"
        >
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2
                id="foundation-heading"
                className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
              >
                {t("foundation.title")}
              </h2>
              <p className="mt-3 text-muted-foreground">
                {t("foundation.subtitle")}
              </p>
            </div>
            <ul className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
              {foundationItems.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 shadow-sm"
                >
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Check className="size-4" aria-hidden="true" />
                  </span>
                  <span className="text-sm leading-relaxed text-card-foreground">
                    {t(`foundation.items.${item}`)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
