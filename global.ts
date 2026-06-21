import { routing } from "@/i18n/routing";
import messages from "@/messages/en.json";

/**
 * next-intl type augmentation (v4). Declaring `AppConfig` makes the locale
 * strongly typed across the app — `useLocale()` returns `AppLocale` (no casts)
 * and `useTranslations`/`getTranslations` keys are checked against the English
 * catalog (the reference catalog for key coverage).
 */
declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}
