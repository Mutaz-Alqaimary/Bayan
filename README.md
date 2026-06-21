# Bayan — Arabic Literacy & Reading Fluency Platform

Bayan is an **Arabic-first** literacy and reading-fluency platform for schools, Arabic language
centers, and teachers. It measures and visualizes whether a student's Arabic reading ability is
improving over time — reading speed (WPM), accuracy, duration, vocabulary exposure, and progress
trends.

> **Status:** Phase 1 (Foundation) complete. The platform is built one phase at a time — see
> [`docs/phases/00-index.md`](docs/phases/00-index.md).

## Tech stack

- **Next.js 16** (App Router) + **React 19** (React Compiler enabled)
- **TypeScript 5** (strict)
- **Tailwind CSS v4** (CSS-first design tokens)
- **next-intl** — locale routing, RTL/LTR, localized metadata & messages
- **shadcn/ui** (component library, from Phase 3) · **Zustand**, **React Hook Form**, **Zod**,
  **TanStack Table**, **SheetJS**, **Lucide React**, **Supabase JS** (added in their phases)

## Prerequisites

- **Node.js 20+**
- A Supabase project (used from Phase 2 onward)

## Environment variables

Create `.env.local` in the project root (these are consumed starting in Phase 2):

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

> `NEXT_PUBLIC_*` values are exposed to the browser. `SUPABASE_SERVICE_ROLE_KEY` is **server-only**
> — never import it into a Client Component.

## Getting started

```bash
npm install
npm run dev
```

Open `http://localhost:3000` — you are redirected to the default locale `/ar` (Arabic, RTL).
The English experience lives at `/en` (LTR).

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

## Internationalization & RTL

- Locales: **`ar`** (default, RTL) and **`en`** (LTR). Every route is locale-prefixed
  (`/ar/...`, `/en/...`).
- Locale negotiation and redirects run in [`proxy.ts`](proxy.ts) (Next.js 16's renamed
  Middleware) via next-intl.
- Translations live in [`messages/ar.json`](messages/ar.json) and
  [`messages/en.json`](messages/en.json).
- Always use the locale-aware navigation helpers from [`i18n/navigation.ts`](i18n/navigation.ts)
  (`Link`, `useRouter`, `usePathname`) — never `next/link` / `next/navigation` directly.

## Theming

- Light / dark / system, class-based on `<html>`, with a no-flash inline script
  ([`lib/theme.ts`](lib/theme.ts)).
- Design tokens (color, radius) are defined as OKLCH CSS variables in
  [`app/globals.css`](app/globals.css) and mapped to Tailwind via `@theme inline`.

## Project structure

See [`Architecture.md`](Architecture.md) for the full breakdown, and the always-on conventions in
[`.claude/rules/`](.claude/rules). The database is a fixed, read-only contract — see
[`.claude/rules/database-schema.md`](.claude/rules/database-schema.md).
