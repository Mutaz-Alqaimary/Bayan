---
description: The premium educational-SaaS design bar for Bayan — typography, dashboards, components, states, dark mode, motion, accessibility. Read before implementing any screen; also see the design-pass skill.
---

# Design System

Bayan must read as a premium, commercial educational SaaS product — something a real school
would trust — not a generic CRUD admin template. Inspiration: Vercel Dashboard, Linear, Notion,
Stripe Dashboard, Duolingo, Khan Academy. Avoid: Bootstrap-default look, crowded layouts,
excessive color, dense unstyled tables, anything that reads as a tutorial project.

## Process (see the `design-pass` skill for the runnable version)

For every new screen: analyze user goals → design the UX → design the information architecture →
design the page layout → design the component hierarchy → design responsive behavior → design
accessibility behavior → **then** implement.

## Visual design system

- Design tokens for spacing, typography, radius, shadow, and color — consistent scales, not
  arbitrary one-off values per component.
- Card-based layouts with soft shadows and rounded corners; clean sections; generous whitespace;
  strong visual hierarchy.
- Reusable design primitives (the Phase 3 component library) — build once, reuse everywhere.

## Typography

- Single typography system app-wide. Preferred Arabic faces: IBM Plex Sans Arabic, Cairo, or
  Tajawal — choose one pairing and stay consistent.
- Comfortable line height and paragraph spacing for sustained Arabic reading (this is a reading
  app — typography quality directly serves the product's purpose).
- Strong, clear heading hierarchy.

## Dashboards

- **Admin**: KPI cards, student statistics, reading analytics, system overview, quick actions.
- **Teacher**: student progress, reading performance, vocabulary progress, recent activity,
  reading insights.
- **Student**: reading progress, reading history, vocabulary growth, reading goals, personal
  analytics.

Each dashboard should answer its role's core question at a glance — a teacher should be able to
spot a struggling reader without digging.

## Components

- **Forms**: clean layouts, clear inline validation (localized), accessible controls, proper
  spacing.
- **Tables**: TanStack Table — search, filters, sorting, pagination, responsive behavior (don't
  just let a wide table overflow on mobile; collapse to cards or a scoped horizontal scroll).
- **Cards**: soft shadows, rounded corners, clear hierarchy.
- **Dialogs/Drawers**: accessible, responsive, well-structured.
- **Navigation**: clear, minimal, easy to understand at a glance.

## Responsive

Mobile-first. Support phones, tablets, laptops, desktops. Layouts, tables, forms, and navigation
must all adapt — not just reflow awkwardly.

## Dark mode

First-class, not an auto-inverted afterthought. Proper contrast, consistent color and shadow
treatment, intentional in both themes.

## Motion

Subtle only — smooth transitions, elegant hover states, small micro-interactions. Respect
`prefers-reduced-motion` (and the `user_settings.reduced_motion` field). Avoid distracting
animation.

## Loading, empty, and error states (required for every list/detail view)

- **Loading**: skeleton loaders, progressive loading, no layout shift between skeleton and
  loaded content.
- **Empty**: explain the situation in plain language and suggest a next action (e.g. "No
  students yet — add your first student" with a CTA), styled to match the design system, not a
  bare "No data" string.
- **Error**: clear, user-friendly message with a recovery suggestion, no raw technical jargon or
  stack traces surfaced to the user.

## Accessibility (designed in, not bolted on)

WCAG-aware contrast and structure, full keyboard navigation, visible focus states, screen reader
support, and RTL-correct accessibility (reading order and focus order match the visual RTL
layout, not the underlying LTR markup order). See the `a11y-auditor` subagent.

## The bar

After building a screen, ask: does this feel professional, trustworthy, and production-ready —
something a real school principal would be comfortable seeing in a sales demo? If it reads as a
default admin template, it's not done.
