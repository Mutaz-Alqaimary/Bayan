---
description: Arabic-first, RTL-first requirements — the primary experience, not a translated afterthought.
---

# Arabic-First, RTL & Localization

Arabic is the primary experience. Design and build for Arabic first, then verify the English/LTR
experience still holds up — not the other way around.

## Requirements

- **RTL by default** for the Arabic locale; **LTR** for English.
- **Unicode-safe rendering** everywhere user content flows (names, passage text, vocabulary).
- **Mixed Arabic/English content support** — student names, passage titles, and UI strings can
  combine both scripts in the same view.
- **BiDi text handling** — numbers, dates, and embedded Latin terms inside Arabic sentences must
  not visually scramble. Use the Unicode bidi algorithm correctly (e.g. `dir` attributes,
  isolation where mixed content is unavoidable) rather than forcing one direction everywhere.
- **Localized routes** (e.g. `/ar/...`, `/en/...` via next-intl), **localized metadata**
  (titles, descriptions), **localized toasts**, **localized validation and error messages** —
  Zod error messages and form validation copy must be translated, not just labels.
- **Arabic search support** and **Arabic sorting awareness** — don't assume locale-naive string
  sort/search works correctly for Arabic collation.
- **Arabic accessibility support** — screen reader behavior, reading order, and focus order must
  be correct in RTL, not just visually mirrored.

## RTL pitfalls to actively check for

- Icons that imply direction (arrows, chevrons, "back") must flip in RTL.
- `margin-left`/`margin-right`, `left`/`right` positioning, and `text-align` should use logical
  properties (`margin-inline-start`, `inset-inline-start`, etc.) so they mirror automatically
  instead of being hardcoded per direction.
- Number formatting (Western Arabic numerals vs. Eastern Arabic numerals) — confirm which the
  product wants and apply it consistently; don't let it vary by component.
- Tables, charts, and data-dense views (TanStack Table, analytics charts) need explicit RTL
  verification — these often default to LTR internals even inside an RTL page.
- Form field order, stepper/wizard flow direction, and toast/notification entry direction should
  all mirror in RTL.

## Typography

Primary Arabic typefaces (single typography system app-wide): **IBM Plex Sans Arabic**, **Cairo**,
or **Tajawal** — pick one pairing and apply it consistently. See `design-system.md` for full
typography requirements.
