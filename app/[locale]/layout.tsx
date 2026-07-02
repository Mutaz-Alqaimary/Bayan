import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { AppProviders } from "@/components/providers/app-providers";
import { ThemeInitScript } from "@/components/theme-init-script";
import { getLocaleDirection, routing, type AppLocale } from "@/i18n/routing";
import { DEFAULT_LOCALE } from "@/lib/constants";
import { fontSans } from "@/lib/fonts";
import { getSiteUrl } from "@/lib/site-url";

import "../globals.css";

/** Pre-render both locales at build time. */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  const tBrand = await getTranslations({ locale, namespace: "brand" });

  const title = t("title");
  const description = t("description");

  return {
    metadataBase: new URL(getSiteUrl()),
    title: {
      default: title,
      template: `%s · ${title}`,
    },
    description,
    // Canonical is the locale root — the primary indexable marketing surface;
    // `languages` emits hreflang alternates so `/ar` and `/en` cross-reference
    // each other. Paths are relative and resolved against `metadataBase`.
    alternates: {
      canonical: `/${locale}`,
      languages: {
        ar: "/ar",
        en: "/en",
        "x-default": `/${DEFAULT_LOCALE}`,
      },
    },
    openGraph: {
      type: "website",
      siteName: tBrand("name"),
      title,
      description,
      url: `/${locale}`,
      locale: locale === "ar" ? "ar_AR" : "en_US",
      alternateLocale: locale === "ar" ? "en_US" : "ar_AR",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enable static rendering for this locale.
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      dir={getLocaleDirection(locale)}
      suppressHydrationWarning
      className={fontSans.variable}
    >
      <body>
        <ThemeInitScript />
        <NextIntlClientProvider>
          <AppProviders>{children}</AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
