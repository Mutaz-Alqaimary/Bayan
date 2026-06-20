---
description: Code quality bar — strict TypeScript, Zod everywhere, no mocks/placeholders, required states.
---

# Code Quality

- **Strict TypeScript.** No `any`, no unchecked type assertions to silence a real error.
- **ESLint clean.** Don't disable rules to make a warning go away; fix the underlying issue.
- **Zod validation everywhere applicable** — all form input, and anything crossing a
  client/server boundary, should be validated against a Zod schema with localized error
  messages (see `arabic-rtl-i18n.md`).
- **No placeholders.** No `TODO` comments, fake API calls, fake/mock data, or "implement later"
  stubs unless the user explicitly asks for a stub. If something can't be finished, say so and
  explain why rather than shipping a silent placeholder.
- **Every list/detail view needs loading, empty, and error states** — see `design-system.md` for
  what each should look like. A screen without all three isn't done.
- **Accessible components by default** — semantic HTML, proper labels, keyboard support, not
  retrofitted in Phase 15. Phase 15 is an audit pass, not the first time accessibility is
  considered.
- **Reusable architecture** — prefer composing the Phase 3 component library over one-off
  implementations.
