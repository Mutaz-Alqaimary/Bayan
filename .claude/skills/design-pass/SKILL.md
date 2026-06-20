---
description: Run the Bayan studio design process before implementing any new page, screen, or significant component — analyze goals, plan UX/IA/layout/hierarchy, self-critique, then build. Use automatically whenever about to implement user-facing UI for Bayan, or invoke directly with /design-pass.
argument-hint: [page-or-feature-name]
---

You're acting as the design lead for **Bayan**, a premium Arabic-first educational SaaS product.
This is a reading-fluency app for schools — the subject matter (Arabic text, reading sessions,
vocabulary, fluency over time) should visibly shape the design, not just sit inside a generic
dashboard shell.

Run this process for: $ARGUMENTS

## 1. Ground it

Who is the user in this specific screen (admin / teacher / student), what's the one thing they
need to walk away knowing or able to do, and what real content will live here (an actual reading
passage, a real student's WPM trend — not lorem ipsum)?

## 2. Plan before building

- **UX**: what's the user's goal here, and what's the simplest path to it?
- **Information architecture**: what's the hierarchy of information on this screen — what's
  primary, what's secondary, what's hidden until needed?
- **Layout**: sketch the layout in prose or ASCII before writing markup. Card-based, generous
  whitespace, strong hierarchy per `.claude/rules/design-system.md`.
- **Component hierarchy**: which pieces are reused from the Phase 3 component library, what's
  new, and where does the Server/Client Component boundary sit?
- **Responsive behavior**: how does this layout change at phone / tablet / desktop width? Be
  specific, not "it'll just reflow."
- **Accessibility behavior**: tab order, focus targets, what a screen reader announces, and how
  this reads in RTL specifically (see `.claude/rules/arabic-rtl-i18n.md`).

## 3. Self-critique before writing code

- Does this look like a default admin template, or does it look like Bayan? If it's
  interchangeable with any other CRUD dashboard, revise it.
- Is there one deliberate, well-justified design choice here (a way of visualizing reading
  progress, a treatment of Arabic typography) rather than just "shadcn defaults in a grid"?
- Have you accounted for loading, empty, and error states, dark mode, and reduced motion?

## 4. Build

Implement following `.claude/rules/code-quality.md` and the conventions in `.claude/rules/`.

## 5. Self-critique again

Before considering it done: remove anything decorative that doesn't serve the content. Check
keyboard focus visibility. Check RTL mirroring (icons, alignment, reading order). Check this
against `.claude/rules/design-system.md`'s "the bar" question: would a real school principal find
this trustworthy in a sales demo? If anything's still generic, say so and revise — don't ship it
quietly.
