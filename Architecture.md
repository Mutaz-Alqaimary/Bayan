# Architecture

This document describes the structure and architectural decisions established in **Phase 1
(Foundation)**. It complements the always-on conventions in [`.claude/rules/`](.claude/rules)
(`architecture.md`, `tech-stack.md`, `naming-conventions.md`, `arabic-rtl-i18n.md`,
`design-system.md`, `code-quality.md`).

## Guiding principles

- **Arabic-first, RTL-first.** Arabic (`ar`) is the default locale and the primary experience.
- **Server Components by default.** Client Components are used only where interactivity demands it
  (theme toggle, locale switcher), and the `"use client"` boundary is kept at the leaf.
- **Feature-based structure**, not type-based dumping grounds.
- **Strict TypeScript**, no `any`, typed boundaries.
- **No hardcoded UI strings or routes** — everything goes through next-intl and the locale-aware
  navigation helpers.

## Folder structure

```text
app/
  [locale]/
    layout.tsx        # Root layout: <html lang/dir>, fonts, no-flash theme script, providers
    page.tsx          # Localized landing page (navigation shell + hero + sections)
    not-found.tsx     # Locale-scoped 404 (inherits dir, theme, fonts)
  globals.css         # Tailwind v4 entry + OKLCH design tokens + base layer

components/
  layout/             # App chrome / navigation shell
    site-header.tsx   # Sticky top nav (brand + controls)
    site-footer.tsx
    brand-mark.tsx    # Logo + wordmark (locale-aware home link)
    locale-switcher.tsx  # ar <-> en, preserves path (client)
    theme-toggle.tsx     # light <-> dark (client)
    skip-link.tsx        # Accessibility: skip to #main-content
  providers/
    app-providers.tsx    # Single composition point for client providers
    theme-provider.tsx   # Theme context (light/dark/system) + class application

features/             # Feature-based domain code (added per phase) — see features/README.md

i18n/
  routing.ts          # defineRouting: locales, defaultLocale, localePrefix + direction helper
  navigation.ts       # Locale-aware Link / useRouter / usePathname / redirect
  request.ts          # getRequestConfig: resolves locale + loads messages

lib/
  fonts.ts            # IBM Plex Sans Arabic (next/font), exposed as --font-sans
  theme.ts            # Theme types, storage key, no-flash inline script
  utils.ts            # cn() — clsx + tailwind-merge

messages/
  ar.json             # Arabic catalog (primary)
  en.json             # English catalog

proxy.ts              # Next.js 16 Proxy (renamed Middleware): next-intl locale negotiation
next.config.ts        # Wrapped with createNextIntlPlugin; React Compiler enabled
```

## Internationalization & RTL

- **next-intl** drives locales `ar` (default, RTL) and `en` (LTR). `localePrefix: "always"`
  keeps every URL explicitly scoped (`/ar/...`, `/en/...`).
- **`proxy.ts`** is Next.js 16's renamed Middleware. It runs next-intl's middleware to redirect
  `/` to the default locale, validate prefixes, and maintain the locale cookie. The matcher
  excludes `api`, `_next`, `_vercel`, and static files.
- **Direction** is set on `<html dir>` in the locale layout via `getLocaleDirection(locale)`. All
  spacing/positioning uses **logical** Tailwind utilities (`gap`, `start-*`, `inset-inline-*`,
  `me-*`/`ms-*`) so layouts mirror automatically instead of being hardcoded per direction.
- **Navigation** always goes through `@/i18n/navigation` so the active locale prefix is applied
  and no route is hardcoded.
- **Metadata** is localized in `generateMetadata` (title template + description per locale).

## Theming

- Three modes — `light`, `dark`, `system` — mirroring the future `user_settings.theme` values.
- Class-based dark mode (`.dark` on `<html>`) with a Tailwind v4 `@custom-variant`.
- A dependency-free **no-flash inline script** (`lib/theme.ts`) sets the class and `color-scheme`
  before first paint; `ThemeProvider` then syncs React state without re-flashing.
- Tokens are **OKLCH CSS variables** in `globals.css`, mapped to Tailwind via `@theme inline`,
  following shadcn/ui v4 conventions so the Phase 3 component library composes against them.

## Providers architecture

`app/[locale]/layout.tsx` composes, from outside in:

1. `<html>` with `lang` + `dir` and the font variable class.
2. `NextIntlClientProvider` — supplies locale/messages to Client Components (configuration is
   inherited from the server, no props needed).
3. `AppProviders` — the single composition point for client providers (`ThemeProvider` today;
   future client stores/toasts are added here).

## Rendering & data strategy

- `generateStaticParams` pre-renders both locales; `setRequestLocale` enables static rendering
  per request.
- Phase 1 has no data layer. From Phase 2, all Supabase access is wrapped in typed functions
  (no ad-hoc `.from("table")` in components), gated by role at the data layer — see
  `.claude/rules/architecture.md`.

> **Supabase database types are always generated, never hand-written.** Generate them with the
> Supabase CLI (`supabase gen types typescript`) from the existing database and commit the output
> (e.g. to `lib/supabase/database.types.ts`). Do **not** hand-author or edit these types — the
> database is a fixed, read-only contract (`.claude/rules/database-schema.md`), and the generated
> types are the source of truth that the named record types (`StudentRecord`, etc.) build on.
> Hand-written types drift from the schema and silently break the type-safety guarantee.

## Accessibility foundations

- Semantic landmarks (`header`, `nav[aria-label]`, `main#main-content`, `footer`).
- A **skip link** to the main landmark, visible on focus.
- Visible focus rings on all interactive controls (`focus-visible:ring-*`).
- `prefers-reduced-motion` is respected globally in the base layer (and will be wired to
  `user_settings.reduced_motion` in Phase 12).
- Decorative icons are `aria-hidden`; controls carry localized `aria-label`s.

## Conventions locked for later phases

- **Naming** follows `.claude/rules/naming-conventions.md` exactly (`StudentRecord`,
  `useStudentStore`, `supabaseClient` / `supabaseServerClient`, `<Verb><Entity>FormValues`).
- **Database** is a read-only contract (`.claude/rules/database-schema.md`) — no migrations, no
  schema changes, no invented columns.
- **Every list/detail view** ships loading, empty, error, and success states (from the phases
  that introduce data).
