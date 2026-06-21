"use client";

import { DirectionProvider } from "@radix-ui/react-direction";
import { useLocale } from "next-intl";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getLocaleDirection } from "@/i18n/routing";

/**
 * Single composition point for all client-side providers. Server-only
 * configuration (locale, messages) is supplied by `NextIntlClientProvider`
 * in the locale layout; client concerns are composed here.
 *
 * `DirectionProvider` feeds the active text direction to every Radix primitive
 * (menus, selects, tooltips, etc.) so they position, animate, and key-navigate
 * correctly in RTL without per-component overrides.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  const direction = getLocaleDirection(locale);

  return (
    <DirectionProvider dir={direction}>
      <ThemeProvider>
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </DirectionProvider>
  );
}
