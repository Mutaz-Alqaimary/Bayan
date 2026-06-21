"use client";

import { Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";

import { usePathname, useRouter } from "@/i18n/navigation";
import { LOCALE_LABELS, type AppLocale } from "@/lib/constants";

/**
 * Switches between Arabic and English while preserving the current path.
 * The option is labeled with the target language's own endonym (e.g. "English"
 * on an Arabic page) and carries a matching `lang` attribute so screen readers
 * pronounce that opposite-script text correctly.
 */
export function LocaleSwitcher() {
  const t = useTranslations("locale");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const nextLocale: AppLocale = locale === "ar" ? "en" : "ar";

  function switchLocale() {
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  }

  return (
    <button
      type="button"
      onClick={switchLocale}
      disabled={isPending}
      aria-label={t("switch")}
      title={t("switch")}
      className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60"
    >
      <Globe className="size-4" aria-hidden="true" />
      <span lang={nextLocale}>{LOCALE_LABELS[nextLocale]}</span>
    </button>
  );
}
