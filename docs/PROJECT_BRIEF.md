# Bayan — Project Brief (reference)

This is the canonical product brief for Bayan, condensed from the original specification. It is **not** loaded into context automatically — read it when you need full context beyond what's in `CLAUDE.md` and `.claude/rules/`.

The phase-by-phase build plan itself lives in `docs/PHASES.md` (tracker) and `.claude/skills/phase-XX-*/SKILL.md` (one skill per phase, run with `/phase-XX-name`). This document covers everything *around* the phases: who the product is for, how it should look and feel, and the constraints that apply across every phase.

## Role
Build as a Staff Frontend Engineer and Technical Lead, acting also as Senior Product Designer and Senior UX Designer for anything visual. The result must be production-grade, school-ready, Arabic-first, CV-quality, maintainable, and scalable.

## Product overview
Bayan is an Arabic-first literacy and reading-fluency platform. It helps schools, teachers, and students improve Arabic reading skills through reading passages, vocabulary learning, reading fluency tracking, reading analytics, and progress monitoring. Intended for schools, Arabic language centers, Arabic literacy programs, and individual teachers.

Primary users: **admin**, **teacher**, **student**.

## User journeys
**Admin** — manages the platform, teachers, students, reading content; reviews reports and analytics.

**Teacher** — manages students; creates/manages reading passages and vocabulary terms; reviews student progress and reading analytics.

**Student** — reads passages, learns vocabulary, completes reading sessions, tracks personal progress, views reading history.

## Core business goal
The platform must help teachers answer: **"Is the student's Arabic reading ability improving over time?"**

It must measure: reading speed, reading accuracy, reading duration, vocabulary exposure, and reading progress trends.

## UX requirements
Arabic is the primary experience (RTL-first). Mobile-first, accessible, teacher-friendly workflows, student-friendly reading experience, clear dashboards, simple navigation, fast page transitions, consistent design language, readable Arabic typography, responsive layouts, touch-friendly interfaces, minimal cognitive load, clear visual hierarchy.

## UI design philosophy & style
Premium educational SaaS interface — not a generic CRUD dashboard. Design inspiration: Vercel Dashboard, Linear, Notion, Stripe Dashboard, Duolingo, Khan Academy. Avoid Bootstrap-style interfaces, generic CRUD/admin-template appearance, crowded layouts, excessive colors, outdated patterns, poor spacing, visual clutter.

Before implementing any page: analyze user goals → design the UX → design the information architecture → design the page layout → design the component hierarchy → design responsive behavior → design accessibility behavior → **then** implement. Never jump straight into coding.

The full detail for typography, the visual/token system, dashboards, components, responsiveness, dark mode, motion, and states lives in `.claude/rules/arabic-and-design.md` — treat it as part of this brief.

## Final UI goal & success metrics
Users should immediately feel the platform is professional, trustworthy, production-ready, designed for real schools, and premium. It must never look like a tutorial project, student assignment, basic CRUD app, or generic admin dashboard.

Teachers should be able to: identify struggling readers, monitor reading improvement over time, track vocabulary growth, compare student progress, and generate meaningful reports.

Students should be able to: improve reading fluency, learn new vocabulary, monitor personal progress, and build reading confidence.

## Hard constraints
- The Supabase database **already exists**. Do not create schema, generate migrations, invent table names, or rename columns. Use only the schema in `.claude/rules/database-schema.md`.
- Never use placeholders, mock implementations, TODO comments, fake APIs, or fake data unless explicitly requested.

## Tech stack
Next.js 16 · React 19 · TypeScript 5.x · Tailwind CSS 4 · shadcn/ui · next-intl · Zustand · React Hook Form · Zod · TanStack Table · SheetJS · Lucide React · Supabase JS. Optional: Framer Motion, Radix UI.

## Arabic-first requirements
RTL by default for Arabic, LTR for English, Unicode-safe rendering, proper Arabic typography, mixed Arabic/English content support, BiDi text handling, Arabic validation/error messages, Arabic accessibility support, Arabic search support, Arabic sorting awareness, localized routes, localized metadata, localized toasts.

## Architecture rules
Feature-based architecture, App Router, Server Components by default (Client Components only when necessary), strict TypeScript, type-safe data layer, reusable UI patterns, scalable folder structure. Avoid god components, deep prop drilling, duplicated logic, hardcoded strings, hardcoded routes.

## Database tables (locked — see `.claude/rules/database-schema.md`)
`profiles`, `students`, `reading_passages`, `reading_sessions`, `vocabulary_terms`, `user_settings`. Storage bucket: `avatars`.

## Environment variables
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

## Naming rules
See `.claude/rules/architecture.md` for the exact, locked names for record types, form types, Zustand stores, and Supabase clients. Never invent alternative names.

## Authorization rules
Roles: `admin`, `teacher`, `student`. Minimum permissions per role are defined in `.claude/rules/auth-and-quality.md`.

## Code quality rules
Strict TypeScript, ESLint clean, production-ready code, accessible components, reusable architecture, proper loading/empty/error states, strong typing, Zod validation everywhere applicable.

## Workflow rules
Work ONLY one phase at a time. At the end of every phase: stop, summarize the implementation, explain the architecture, explain the review checklist, and wait for approval. Never continue automatically. See `docs/PHASES.md` for the full list of 20 phases and their status.