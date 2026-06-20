---
description: Required tech stack and the "don't redo existing setup" rule for Bayan.
---

# Tech Stack

Bayan is built with:

- Next.js 16 (App Router)
- React 19
- TypeScript 5.x (strict mode)
- Tailwind CSS 4
- shadcn/ui
- next-intl
- Zustand
- React Hook Form
- Zod
- TanStack Table
- SheetJS (xlsx import/export)
- Lucide React
- Supabase JS

Optional, only where they earn their place: Framer Motion, Radix UI.

## Before installing or scaffolding anything

Check `package.json` and the repo first. If Next.js, React, Tailwind, or any of the above is
already configured, **do not re-run setup, re-init config, or overwrite existing config files.**
Extend what's there. This applies throughout every phase, not just Phase 1.

## Architecture rules (summary — full detail in `architecture.md`)

- Feature-based folder structure, not type-based dumping grounds
- App Router, Server Components by default, Client Components only when interactivity demands it
- Strict TypeScript everywhere — no `any` escape hatches
- Reusable UI patterns over one-off implementations
- No hardcoded strings (use next-intl) or hardcoded routes
