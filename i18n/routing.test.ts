import { describe, expect, it } from "vitest";

import { getLocaleDirection, routing } from "@/i18n/routing";
import { DEFAULT_LOCALE, LOCALES } from "@/lib/constants";

/**
 * Locale-config sanity + the direction rule. Arabic is the primary, default,
 * RTL experience; English is LTR (`arabic-rtl-i18n.md`).
 */
describe("locale configuration", () => {
  it("supports exactly ar + en, with ar as the default", () => {
    expect([...LOCALES]).toEqual(["ar", "en"]);
    expect(DEFAULT_LOCALE).toBe("ar");
    expect(LOCALES).toContain(DEFAULT_LOCALE);
  });

  it("wires next-intl routing to the same locales and default", () => {
    expect([...routing.locales]).toEqual([...LOCALES]);
    expect(routing.defaultLocale).toBe(DEFAULT_LOCALE);
  });
});

describe("getLocaleDirection", () => {
  it("is RTL for Arabic and LTR for English", () => {
    expect(getLocaleDirection("ar")).toBe("rtl");
    expect(getLocaleDirection("en")).toBe("ltr");
  });
});
