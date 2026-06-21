import { BrandMark } from "@/components/layout/brand-mark";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";

/**
 * The platform's top navigation shell. Logical properties (gap, inline padding)
 * mirror automatically between RTL and LTR — no direction-specific overrides.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <BrandMark />
        <nav aria-label="Primary" className="flex items-center gap-2">
          <LocaleSwitcher />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
