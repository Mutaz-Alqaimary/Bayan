"use client";

import { ThemeProvider } from "@/components/providers/theme-provider";

/**
 * Single composition point for all client-side providers. Server-only
 * configuration (locale, messages) is supplied by `NextIntlClientProvider`
 * in the locale layout; client concerns (theme today, and future stores
 * such as toasts) are composed here so the layout stays declarative.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
