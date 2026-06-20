# Phase 4 — Localization & RTL

## Goal
Make the localization and RTL plumbing complete and correct app-wide, per
`.claude/rules/arabic-rtl-i18n.md`.

## Build
- Language switcher
- Localized routes
- Localized metadata
- Localized validation (Zod messages)
- Localized errors
- Localized toasts

## Docs to create
- `Localization.md` — how locale routing, messages, and the switcher work
- `RTL.md` — explain Unicode/BiDi handling, RTL pitfalls actively addressed, and how logical CSS
  properties are used instead of hardcoded direction

## Definition of done
- Switching language correctly flips direction app-wide with no broken layout.
- No hardcoded `left`/`right`/`margin-left` remains where a logical property should be used.
- Validation and toast copy is fully localized, not just static labels.
