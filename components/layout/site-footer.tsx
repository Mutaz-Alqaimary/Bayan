import { useTranslations } from "next-intl";

/**
 * Minimal marketing footer. Server component; the year is computed at render time.
 */
export function SiteFooter() {
  const tBrand = useTranslations("brand");
  const tFooter = useTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/80 bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-2 px-4 py-8 text-center sm:px-6 lg:px-8">
        <p className="text-sm text-muted-foreground">
          {tFooter("builtFor")}
        </p>
        <p className="text-sm font-medium text-foreground">
          {/* Isolate the Latin year so it doesn't reorder within the Arabic line (BiDi). */}
          © <bdi>{year}</bdi> {tBrand("name")} — {tFooter("rights")}
        </p>
      </div>
    </footer>
  );
}
