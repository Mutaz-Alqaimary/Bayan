import type { ReactElement, ReactNode } from "react";

import { DirectionProvider } from "@radix-ui/react-direction";
import { render, type RenderResult } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

import { getLocaleDirection } from "@/i18n/routing";
import { DEFAULT_LOCALE, type AppLocale } from "@/lib/constants";
import arMessages from "@/messages/ar.json";
import enMessages from "@/messages/en.json";

/**
 * Render a client component with the **real** i18n catalogs and the locale's
 * text direction wired exactly as the app's root layout does it (Phase 16
 * Component/RTL tests). Production copy and direction flow through, so:
 *  - asserting rendered text proves the message actually resolved (not the key);
 *  - the `dir` ancestor mirrors the document `dir` the layout sets, so a
 *    component that overrides it (e.g. an LTR email field inside an RTL page) is
 *    testable against real inherited direction.
 */
const MESSAGES: Record<AppLocale, Record<string, unknown>> = {
  ar: arMessages,
  en: enMessages,
};

export function renderWithIntl(
  ui: ReactElement,
  { locale = DEFAULT_LOCALE }: { locale?: AppLocale } = {},
): RenderResult {
  const dir = getLocaleDirection(locale);

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]}>
        <DirectionProvider dir={dir}>
          <div dir={dir} data-testid="intl-root">
            {children}
          </div>
        </DirectionProvider>
      </NextIntlClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper });
}
