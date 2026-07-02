import { useTranslations } from "next-intl";

import { BrandMark } from "@/components/layout/brand-mark";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/lib/routes";

/**
 * The platform's top navigation shell. Logical properties (gap, inline padding)
 * mirror automatically between RTL and LTR — no direction-specific overrides.
 */
export function SiteHeader() {
  const t = useTranslations("nav");

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <BrandMark />
        <nav aria-label="Primary" className="flex items-center gap-2">
          <LocaleSwitcher />
          <ThemeToggle />
          <Link
            href={ROUTES.login}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {t("login")}
          </Link>
        </nav>
      </div>
    </header>
  );
}
