import { BookOpenText } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * The Bayan wordmark + logo, linking home in a locale-aware way.
 * Server component — no interactivity required.
 */
export function BrandMark({ className }: { className?: string }) {
  const t = useTranslations("brand");

  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <BookOpenText className="size-5" aria-hidden="true" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-base font-bold tracking-tight">{t("name")}</span>
        <span className="text-[0.7rem] font-medium text-muted-foreground">
          {t("tagline")}
        </span>
      </span>
    </Link>
  );
}
