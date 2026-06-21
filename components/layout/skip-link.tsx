import { useTranslations } from "next-intl";

/**
 * Keyboard-accessible "skip to content" link. Visually hidden until focused,
 * then anchors to the page's main landmark (#main-content).
 */
export function SkipLink() {
  const t = useTranslations("nav");

  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
    >
      {t("skipToContent")}
    </a>
  );
}
