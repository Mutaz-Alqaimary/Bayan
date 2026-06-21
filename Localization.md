# Localization

How locale routing, message catalogs, and localized validation/errors/toasts work in Bayan.
Complements [`Architecture.md`](Architecture.md) and `.claude/rules/arabic-rtl-i18n.md`.

## Locale routing

- **next-intl** (`i18n/routing.ts`) defines two locales — `ar` (default) and `en` — with
  `localePrefix: "always"`, so every URL is explicitly scoped (`/ar/...`, `/en/...`). There is no
  unprefixed route.
- `proxy.ts` (Next.js 16's renamed Middleware) runs next-intl's locale negotiation before
  Supabase's `updateSession`, on every request except `api`, `_next`, `_vercel`, and static
  files.
- `i18n/navigation.ts` (`createNavigation`) exports locale-aware `Link`, `redirect`,
  `usePathname`, `useRouter`, `getPathname`. **Always** import navigation from here, never from
  `next/link` or `next/navigation` directly — that's how the active locale prefix stays attached
  and no route gets hardcoded.
- `i18n/request.ts` resolves the request locale and loads `messages/${locale}.json`.

## Message catalogs

- `messages/ar.json` is the primary catalog; `messages/en.json` is secondary. Both must stay in
  sync key-for-key.
- `global.ts` augments next-intl's `AppConfig` with `Messages: typeof messages` (from the English
  catalog), so `useTranslations`/`getTranslations` namespace and key arguments are type-checked
  at compile time — a typo or a key that exists in `ar.json` but not `en.json` is a type error.
- Namespaces today: `metadata`, `common`, `validation`, `errors`, `pagination`, `brand`, `nav`,
  `theme`, `locale`, `home`, `footer`, `notFound`.

## Language switcher

`components/layout/locale-switcher.tsx` is a small Client Component. It reads the current locale
with `useLocale()`, computes the *other* locale, and calls `router.replace(pathname, { locale })`
from `@/i18n/navigation` — this swaps the locale segment while preserving the rest of the path.
The button label shows the **target** locale's own endonym (e.g. "English" while reading Arabic)
with a matching `lang` attribute, so screen readers pronounce it correctly in its own language
rather than the page's.

## Localized metadata

`app/[locale]/layout.tsx` calls `getTranslations({ locale, namespace: "metadata" })` inside
`generateMetadata` to produce a localized title template and description per locale. Any route
that needs its own metadata follows the same pattern with its own namespace.

## Localized validation (Zod)

Zod messages are localized through `lib/validation/`, **not** through Zod's built-in
`z.config()` / global error-map mechanism. That mechanism mutates module-level state, which is
unsafe here: Next.js can interleave concurrent requests for different locales in the same Node
process, so a global "current locale's error map" can leak across requests mid-flight.

Instead, `lib/validation/types.ts` defines the shared `ValidationMessages` shape and a pure
builder (`buildValidationMessages`) from a translator function. Two thin, paired entry points
wrap it — mirroring the existing `supabaseClient` / `supabaseServerClient` split:

- `useValidationMessages()` (`lib/validation/client.ts`) — Client Components, via
  `useTranslations("validation")`.
- `getValidationMessages()` (`lib/validation/server.ts`) — Server Components, Server Actions,
  Route Handlers, via `getTranslations("validation")`.

Both return the same `ValidationMessages` object: `required()`, `invalidType()`,
`invalidEmail()`, `tooShort(min)`, `tooLong(max)` — the last two take the bound as an argument
because the catalog message is an ICU `plural` (`{min, plural, one {...} other {...}}`), correctly
pluralized per locale (Arabic has more plural categories than English, and ICU handles that).

Forms (from Phase 5 onward) pass these into the schema per call:

```ts
const messages = useValidationMessages(); // or `await getValidationMessages()` on the server
const schema = z.object({
  email: z.string().min(1, { error: messages.required() }).email({ error: messages.invalidEmail() }),
});
```

This keeps the localized copy in the message catalogs (single source of truth, consistent
wording with the rest of the product) while staying per-call and therefore concurrency-safe.

A live example exercising this end-to-end (dynamic, locale-aware messages — not static labels)
is in the Phase 3 verification gallery (`app/[locale]/ui`, "Validation" section).

## Localized errors

`lib/errors/` follows the exact same client/server-paired pattern (`useErrorMessages()` /
`getErrorMessages()`, both returning `ErrorMessages`) for **safe, generic, user-facing** error
copy: `generic`, `network`, `unauthorized`, `forbidden` (each a `{ title, description }` pair),
plus `tryAgain`. Per `.claude/rules/code-quality.md`, feature code maps a caught error to one of
these categories and renders the result via `ErrorState` or `toast()` — raw error messages or
stack traces never reach the user.

## Localized toasts

`components/ui/toast.tsx` / `toaster.tsx` (Phase 3) already render whatever `title`/`description`
they're given, with the right `aria-live` politeness (`type="foreground"` for destructive toasts).
Call sites are responsible for passing localized copy — typically from `lib/errors` for failures
and from a feature's own namespace (or `common`) for success copy, e.g.
`tCommon("savedTitle")`/`tCommon("savedDescription")`. The gallery's "Toast" section demonstrates
both paths.

## Adding a new message

1. Add the key to **both** `messages/ar.json` and `messages/en.json` (Arabic first — it's the
   primary catalog).
2. Use `useTranslations`/`getTranslations` with the namespace — TypeScript will flag a missing or
   mistyped key immediately via the `AppConfig` augmentation in `global.ts`.
3. Never hardcode user-facing copy in a component — see `.claude/rules/architecture.md`.
