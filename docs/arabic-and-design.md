# Arabic-First UX & Design System (authoritative)

Bayan must feel like a premium commercial SaaS product (think Vercel, Linear, Notion, Stripe Dashboard, Duolingo, Khan Academy) — never a generic CRUD admin template, tutorial project, or Bootstrap-style dashboard.

## Design process — think before you build
For every new page or component:
1. Analyze user goals (admin / teacher / student).
2. Design the UX flow.
3. Design the information architecture.
4. Design the page layout.
5. Design the component hierarchy.
6. Design responsive behavior (mobile-first).
7. Design accessibility behavior.
8. Only then implement.

If a `frontend-design` skill or plugin is available in this environment, invoke it for palette, typography pairing, layout concept, and signature visual moments. Otherwise apply the rules below directly — they are not optional.

## Arabic-first requirements
- RTL is the default direction; Arabic is the primary locale. English is a fully-supported secondary LTR locale.
- Unicode-safe rendering and correct BiDi behavior for mixed Arabic/English content (names, codes, numbers, dates).
- Arabic validation messages, error messages, toasts, and accessibility labels — not just translated UI chrome.
- Arabic-aware search and sort behavior where relevant.
- Localized routes and localized metadata per locale.

## Typography
- One typography system app-wide. Preferred Arabic fonts: IBM Plex Sans Arabic, Cairo, or Tajawal — pick one family and stay consistent across the whole app.
- Generous line-height and paragraph spacing for comfortable Arabic reading.
- A clear, consistent heading scale, spacing scale, radius scale, and shadow system — expressed as design tokens (Tailwind theme values / CSS variables), never one-off magic numbers.

## Visual system
- Card-based layouts, strong visual hierarchy, generous whitespace, minimal cognitive load.
- Avoid: crowded layouts, excessive colors, admin-template look, dated patterns, visual clutter.
- Full first-class dark mode — intentionally designed (contrast, shadows, and color all reconsidered for dark), not an auto-inverted light theme.
- Motion is subtle only: smooth transitions, elegant hover states, micro-interactions. Respect `prefers-reduced-motion` and the `user_settings.reduced_motion` flag. No flashy or distracting animation.

## Dashboards (per role)
- **Admin** — KPI cards, student statistics, reading analytics, system overview, quick actions.
- **Teacher** — student progress, reading performance, vocabulary progress, recent activity, reading insights.
- **Student** — reading progress, reading history, vocabulary growth, reading goals, personal analytics.

## Components
- Forms: clean layout, inline validation, accessible labels/errors, generous spacing.
- Tables: search, filters, sorting, pagination, responsive collapse on small screens (TanStack Table).
- Cards: soft shadows, rounded corners, clear hierarchy.
- Dialogs/Drawers: accessible (focus trap, ESC to close, labelled), responsive.
- Navigation: minimal, predictable, never makes the user think about where they are.

## Responsive
Mobile-first for every layout, table, form, and nav. Must stay professional at phone, tablet, laptop, and desktop widths.

## Loading, empty, and error states — required on every list/detail view
- **Loading** — skeleton loaders, no layout shift.
- **Empty** — explain the situation in plain language and suggest the next action (e.g. "No students yet — add your first student or import a CSV"). Match the design system, don't just print "No data."
- **Error** — plain-language message, a recovery action, no stack traces or technical jargon surfaced to the user.

## Accessibility (designed in, not bolted on)
- Full keyboard navigation and visible focus states.
- Correct ARIA roles/labels; screen-reader-friendly forms, tables, and dialogs.
- WCAG-aware color contrast in both light and dark mode.
- RTL-aware focus order and screen-reader behavior — verify it, don't assume mirroring "just works."