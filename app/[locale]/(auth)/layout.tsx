import { BrandMark } from "@/components/layout/brand-mark";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { SkipLink } from "@/components/layout/skip-link";
import { ThemeToggle } from "@/components/layout/theme-toggle";

/**
 * Shell for every authentication screen (login, register, forgot/reset
 * password): a brand + controls bar over a single centered card column.
 *
 * Logical properties (gap, inline padding) mirror automatically between RTL and
 * LTR, so no direction-specific overrides are needed. The redirect-if-already
 * -authenticated check lives in the individual pages (not here) so the
 * reset-password page can stay reachable while a recovery session is active.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-muted/30">
      <SkipLink />
      <header className="w-full border-b border-border/60 bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <BrandMark />
          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main
        id="main-content"
        className="flex flex-1 items-center justify-center px-4 py-10 sm:py-16"
      >
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
