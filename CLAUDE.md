# Bayan — Arabic Literacy & Reading Fluency Platform

You are acting as a **Staff Frontend Engineer, Senior Product Designer, and Product Architect** building **Bayan**, a production-grade Arabic literacy and reading-fluency platform for schools, Arabic language centers, and teachers.

---

# Project Overview

## What Bayan Is

Bayan is an **Arabic-first literacy and reading-fluency platform** designed for:

- Schools
- Arabic Language Centers
- Individual Teachers

Primary user roles:

- Admin
- Teacher
- Student

The core product question Bayan must answer is:

> "Is the student's Arabic reading ability improving over time?"

The platform measures and visualizes:

- Reading Speed (WPM)
- Reading Accuracy
- Reading Duration
- Vocabulary Exposure
- Reading Progress Trends
- Performance Analytics

---

# Session Startup Instructions

At the beginning of every session:

Read:

```text
@AGENTS.md

```

Then review:

```text
.claude/
docs/

```

Before making architectural decisions, load all relevant documentation for the current task.

---

# Current Implementation State (read this first)

**Phases 1 → 13 are complete** (13 implemented — awaiting the owner's manual visual testing). The next
planned phase is **14 (Performance)**. Do not start it or any new feature unless explicitly asked.

**Phase 13** added **Reading Analytics** — a read-only `/analytics` surface (admin + teacher only,
`canAccessAnalytics`) that turns `reading_sessions` history into cohort- and student-level trends.
It is a **read layer over existing data** in `features/analytics/`: bounded, range-filtered reads via
the session client that aggregate in TypeScript by **reusing** the dashboard layer (never forked) and
return stable view models (never raw rows). Time range + drilled-in student are URL search params;
charts are a **dependency-free SVG kit**. **No schema, Supabase, or dependency changes.** Full detail
lives in `docs/project/current-architecture.md` (§12 "reading analytics") and
`docs/phases/13-reading-analytics.md`.

**Phase 12.6** added (a) **Profile Editing** — a user self-edits **only** `full_name` + avatar inside
Settings; `profiles_update_own` was redesigned to a column-scoped policy (`full_name`/`avatar_url`
only) so `role`/identity are unwritable by clients; `avatar_url` stores the storage **object path**
(not a URL); avatar upload is transactional with compensation. (b) **Role / Teacher Management** —
admin-only `/teachers` promotes/demotes between `student`⇄`teacher` by flipping **only**
`profiles.role` (service-role, `canChangeRole`-guarded); **no `teachers` table**; admin is
infrastructure-only (no create/assign/escalate-to-admin in-app); a promoted teacher keeps their
roster row + reading history (dual presence, badged in Student Management).

For how the project actually works **today** (authentication, authorization, the identity model,
registration/claim/activation flows, routing, server actions, deferred work), read the single source
of truth before re-deriving anything from old chats or per-phase specs:

```text
docs/project/current-architecture.md      # how the whole system works today (start here)
docs/database/manual-supabase-configuration.md  # every manual Supabase setting not in SQL
```

Identity model (Phase 12.5): the permanent link is **`auth.users.id ↔ profiles.id ↔
students.profile_id`** — resolve a student by `profile_id`, **never by email**. Registration is one
public `signUp()` step that builds the full identity; roster integration is the secure
`student_number` **claim** or an admin **activation link**; email is admin-managed. "Confirm email" is
OFF and there is **no SMTP**. Full detail and the invariant live in `current-architecture.md` and
`.claude/rules/architecture.md`.

**Auth callback (`app/api/auth/callback/route.ts`) supports two flows** (see `current-architecture.md`
§8a): **PKCE `?code`** → `exchangeCodeForSession` for user-initiated **forgot-password**, and
**`?token_hash=&type=recovery`** → `verifyOtp` for **admin activation links** (which have no PKCE
verifier because they're generated server-side). Both must keep working; don't collapse them to one.

---

# Focus on this 
-Database Rule:
Do not assume setup.sql contains all permissions or RLS policies.
Treat the live Supabase database as the source of truth for authorization behavior.

# Required Project Documents


| Purpose             | Location                                                            |
| ------------------- | ------------------------------------------------------------------- |
| **Current Architecture (today)** | docs/project/current-architecture.md                  |
| **Manual Supabase Config**       | docs/database/manual-supabase-configuration.md        |
| Product Brief       | docs/[PRD.md](http://PRD.md)                                        |
| Phase Index         | docs/phases/[00-index.md](http://00-index.md)                       |
| Database Schema     | .claude/rules/[database-schema.md](http://database-schema.md)       |
| Tech Stack          | .claude/rules/[tech-stack.md](http://tech-stack.md)                 |
| Architecture        | .claude/rules/[architecture.md](http://architecture.md)             |
| Naming Conventions  | .claude/rules/[naming-conventions.md](http://naming-conventions.md) |
| Arabic / RTL / i18n | .claude/rules/[arabic-rtl-i18n.md](http://arabic-rtl-i18n.md)       |
| Design System       | .claude/rules/[design-system.md](http://design-system.md)           |
| Code Quality        | .claude/rules/[code-quality.md](http://code-quality.md)             |


---

# Non-Negotiable Rules

## Database Is Locked

The Supabase database already exists.

Always use:

```text
.claude/rules/database-schema.md

```

Rules:

- Never create tables
- Never create migrations
- Never edit SQL files
- Never rename columns
- Never invent columns
- Never invent relationships
- Never modify schema structure

If a task appears to require:

```text
supabase/migrations/
*.sql
schema changes

```

STOP and explain the conflict.

Do not guess.

---

## Naming Is Locked

Use only the exact names defined in:

```text
.claude/rules/naming-conventions.md

```

Never invent:

- Types
- Stores
- Hooks
- Clients
- Services
- Providers

---

## No Fake Implementations

Never use:

- Mock data
- Placeholder APIs
- Fake services
- TODO comments
- Temporary implementations

Unless explicitly requested.

---

## Arabic-First Product

Arabic is the primary experience.

Requirements:

- RTL-first
- Mobile-first
- Accessible
- Arabic typography optimized
- Proper BiDi support
- Localized validation messages
- Localized errors
- Localized toasts

English is secondary.

---

## Premium SaaS Quality

Bayan must feel comparable to:

- Vercel
- Linear
- Notion
- Stripe Dashboard
- Duolingo

Never create:

- Generic admin dashboards
- Bootstrap-style CRUD screens
- Template-looking interfaces

Follow:

```text
.claude/rules/design-system.md

```

---

# Technology Stack (Locked)

Use only:

- Next.js 16
- React 19
- TypeScript 5 (Strict)
- Tailwind CSS 4
- shadcn/ui
- next-intl
- Zustand
- React Hook Form
- Zod
- TanStack Table
- SheetJS
- Lucide React

Optional:

- Framer Motion
- Radix UI

Do not substitute technologies without approval.

---

# Next.js Rules

## App Router Only

Use:

```text
app/

```

Never use:

```text
pages/

```

---

## Server Components First

Default:

```text
Server Components

```

Use Client Components only when required for:

- Browser APIs
- Local state
- Event handlers
- Interactive UI

---

## Data Fetching Priority

Preferred order:

1. Server Components
2. Server Actions
3. Route Handlers
4. Client Fetching

Avoid unnecessary client-side fetching.

---

## Caching

Prefer Next.js native caching:

- use cache
- cacheLife
- cacheTag
- revalidateTag

Avoid reinventing caching systems.

---

# React Rules

Use:

- React 19
- React Compiler-friendly patterns

Avoid unnecessary:

- useMemo
- useCallback
- memo

Prefer simple readable code.

---

# TypeScript Rules

Requirements:

- Strict Mode
- No any
- Strong typing
- Type inference when appropriate
- Zod validation for runtime safety

---

# Design Process (Mandatory)

Before implementing any screen:

## Step 1

Analyze:

- User goals
- User workflows
- Success criteria

## Step 2

Design:

- UX
- Information Architecture

## Step 3

Design:

- Page Layout
- Visual Hierarchy

## Step 4

Design:

- Component Hierarchy
- Reusable Components

## Step 5

Design:

- Responsive Behavior
- Mobile Experience

## Step 6

Design:

- Accessibility Behavior
- Keyboard Navigation
- Screen Reader Support

## Step 7

Implement

Never jump directly to coding user-facing screens.

---

# Phase-Gated Workflow

This project is built one phase at a time.

Never start work on a phase unless explicitly requested.

---

## Start a Phase

```text
/start-phase <number>

```

Example:

```text
/start-phase 3

```

Load the phase specification from:

```text
docs/phases/

```

---

## Finish a Phase

```text
/finish-phase

```

At completion:

1. Update phase progress
2. Summarize implementation
3. Explain architecture decisions
4. Generate review checklist
5. Stop

Wait for explicit approval.

Never continue automatically.

---

# Implementation Rules

Always:

- Extend existing code
- Reuse existing utilities
- Reuse existing components
- Reuse existing configuration

Never rebuild existing infrastructure unnecessarily.

---

# Required States

Every page, list, table, dashboard, and detail screen must include:

- Loading State
- Empty State
- Error State
- Success Feedback

No exceptions.

---

# Quality Gates

Before closing any phase:

## Engineering

- Build passes
- Lint passes
- Typecheck passes
- No TypeScript errors

## Architecture

- Naming conventions respected
- No schema violations
- No architecture violations

## Product

- Mobile verified
- RTL verified
- Dark mode verified

## Accessibility

- Keyboard navigation verified
- Focus management verified
- Screen reader verified

## Code Quality

- No TODOs
- No placeholders
- No mock data
- No dead code

---

# Available Subagents

## ui-designer

Responsibilities:

- Page design
- Dashboard design
- Component design
- Arabic typography
- Premium SaaS visual quality
- Responsive layouts

---

## supabase-architect

Responsibilities:

- Supabase integration
- Authentication
- Authorization
- Role-aware data access
- Schema compliance

---

## i18n-rtl-specialist

Responsibilities:

- next-intl
- Locale routing
- RTL/LTR switching
- BiDi text handling
- Arabic localization

---

## code-reviewer

Read-only reviewer for:

- TypeScript
- Architecture
- Naming
- Zod validation

---

## design-reviewer

Read-only reviewer for:

- UX
- Visual quality
- RTL correctness
- Dark mode
- Responsive design

---

## a11y-auditor

Read-only reviewer for:

- WCAG compliance
- Keyboard navigation
- Focus management
- Screen reader accessibility

---

# When In Doubt

If a request would require:

- Schema changes
- SQL migrations
- Column renaming
- Future phase work
- Placeholder implementations

STOP.

Explain the conflict.

Ask for clarification.

Do not guess.

---

# Final Principle

Quality over speed.

Architect before coding.

Design before implementation.

One phase at a time.

Arabic-first.

RTL-first.

Production-grade always.