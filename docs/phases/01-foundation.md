# Phase 1 — Foundation

## Goal
Stand up the project skeleton: Next.js/React/TS/Tailwind config (only if not already present —
check `package.json` first), App Router, feature-based folder structure, providers, locale
routing, theme provider, navigation shell.

## Build
- Next.js 16 setup (skip if already configured)
- React 19 setup (skip if already configured)
- TypeScript setup (skip if already configured)
- Tailwind CSS v4 setup (skip if already configured)
- App Router
- Feature-based architecture (folder structure)
- Providers architecture
- next-intl setup
- Locale routing
- Arabic locale
- English locale
- RTL/LTR switching
- Theme provider
- Absolute imports
- Root layouts
- Locale layouts
- Navigation shell

## Docs to create
- `README.md` — how to run/build the project
- `Architecture.md` — folder structure and architectural decisions

## Definition of done
- App boots in both `/ar` and `/en` with correct `dir` attribute and no FOUC of the wrong
  direction.
- Folder structure matches `.claude/rules/architecture.md` (feature-based, not type-based).
- No existing tooling was redundantly re-initialized.
