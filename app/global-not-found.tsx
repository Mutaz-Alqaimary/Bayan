import type { Metadata } from "next";

import { getLocaleDirection } from "@/i18n/routing";
import { DEFAULT_LOCALE } from "@/lib/constants";
import { ThemeInitScript } from "@/components/theme-init-script";
import { fontSans } from "@/lib/fonts";
import messages from "@/messages/ar.json";

import "./globals.css";

/*
 * Global 404 for URLs that match no route at all. Next.js bypasses normal
 * rendering for this file, so it must return a complete HTML document and
 * import its own styles/fonts — it cannot rely on the locale layout or the
 * next-intl request context. It renders in the default locale (Arabic).
 */

const t = messages.notFound;

export const metadata: Metadata = {
  title: t.title,
};

export default function GlobalNotFound() {
  return (
    <html
      lang={DEFAULT_LOCALE}
      dir={getLocaleDirection(DEFAULT_LOCALE)}
      suppressHydrationWarning
      className={fontSans.variable}
    >
      <body>
        <ThemeInitScript />
        <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground">
          <p className="text-5xl font-bold tracking-tight text-primary">
            {t.code}
          </p>
          <h1 className="text-2xl font-bold tracking-tight">{t.title}</h1>
          <p className="max-w-md text-muted-foreground">{t.description}</p>
          <a
            href={`/${DEFAULT_LOCALE}`}
            className="mt-2 inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {t.back}
          </a>
        </main>
      </body>
    </html>
  );
}
