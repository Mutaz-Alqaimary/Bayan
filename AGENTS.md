<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# AGENTS.md

# Bayan Agent Operating System

This file defines how specialized agents collaborate while building Bayan.

Claude is the primary implementation agent.

Specialized agents exist to:

* Improve implementation quality
* Reduce context pollution
* Validate architecture decisions
* Review UX and accessibility
* Enforce project standards

Agents never override:

* CLAUDE.md
* Project rules
* Database schema
* Phase specifications

CLAUDE.md remains the single source of truth.

---

# Project Context

Bayan is an Arabic-first literacy and reading-fluency platform.

Primary roles:

* Admin
* Teacher
* Student

Core product question:

> Is the student's Arabic reading ability improving over time?

Every implementation decision should support answering that question through:

* Reading speed
* Accuracy
* Duration
* Vocabulary exposure
* Progress tracking
* Analytics

---

# Focus on this 
-Database Rule:
The canonical current-state SQL is `supabase/schema.sql`. Treat the live Supabase database as the
ultimate source of truth for authorization behavior; live config not in SQL is in
`docs/database/manual-supabase-configuration.md`.

---

# Agent Collaboration Flow

For every phase:

1. Read phase specification
2. Analyze requirements
3. Design UX
4. Design Information Architecture
5. Design UI Structure
6. Implement
7. Review
8. Generate summary
9. Stop

Never skip review steps.

---

# Review Pipeline

Run reviews in this order:

design-reviewer
↓
code-reviewer
↓
a11y-auditor
↓
qa-reviewer

A phase is not complete until all review steps pass.

---

# Agent Directory

## ui-designer

Purpose:

Design premium user experiences.

Responsibilities:

* User flows
* Information architecture
* Page layouts
* Dashboard layouts
* Component hierarchy
* Responsive behavior
* Dark mode behavior
* RTL layouts
* Arabic typography
* Premium SaaS quality

Must review:

* New pages
* New dashboards
* New major components

Reference quality:

* Stripe
* Linear
* Notion
* Vercel
* Duolingo

Cannot:

* Modify database structure
* Change architecture rules
* Override CLAUDE.md

---

## supabase-architect

Purpose:

Protect data architecture.

Responsibilities:

* Supabase integration
* Authentication
* Authorization
* Role-aware access
* Query structure
* Data loading strategy
* Schema validation

Must ensure:

* Existing schema is respected
* No invented columns
* No invented tables
* No schema assumptions

Cannot:

* Create migrations
* Rename columns
* Modify database structure
* Create SQL files

If a task appears to require schema changes:

STOP and escalate.

---

## i18n-rtl-specialist

Purpose:

Guarantee Arabic-first quality.

Responsibilities:

* next-intl
* Locale routing
* RTL behavior
* LTR support
* BiDi text
* Localization
* Validation messages
* Error messages
* Toast messages

Must verify:

* Arabic copy quality
* RTL alignment
* Mixed Arabic/English content
* Navigation behavior

---

## code-reviewer

Purpose:

Validate engineering quality.

Type:

Read-only reviewer

Checks:

* TypeScript quality
* Naming compliance
* Architecture compliance
* React patterns
* Next.js patterns
* Server vs Client boundaries
* Zod validation
* Reusability
* Performance concerns

Cannot modify code directly.

Produces review report only.

---

## design-reviewer

Purpose:

Protect product quality.

Type:

Read-only reviewer

Checks:

* Visual hierarchy
* Layout consistency
* Premium SaaS feel
* Mobile experience
* Dark mode quality
* RTL correctness
* Dashboard usability
* User experience

Cannot modify code directly.

Produces review report only.

---

## a11y-auditor

Purpose:

Protect accessibility quality.

Type:

Read-only reviewer

Checks:

* WCAG compliance
* Keyboard navigation
* Focus management
* Screen readers
* Semantic HTML
* Color contrast
* Reduced motion support
* Form accessibility

Cannot modify code directly.

Produces review report only.

---

## qa-reviewer

Purpose:

Final release validation.

Type:

Read-only reviewer

Checks:

* Acceptance criteria
* Edge cases
* Error handling
* Loading states
* Empty states
* Success states
* User flows
* Regression risks

Produces final phase approval report.

---

# Delegation Rules

Delegate only when it adds value.

Do not invoke specialized agents for trivial work.

Use:

UI design
→ ui-designer

Authentication
→ supabase-architect

Authorization
→ supabase-architect

Localization
→ i18n-rtl-specialist

Accessibility review
→ a11y-auditor

Visual review
→ design-reviewer

Engineering review
→ code-reviewer

Final validation
→ qa-reviewer

---

# Design-First Rule

Before implementing any user-facing screen:

1. User goals
2. User journey
3. Information architecture
4. Layout
5. Component hierarchy
6. Responsive behavior
7. Accessibility behavior
8. Implementation

Never jump directly to code.

---

# Definition of Done

A phase is complete only when:

✓ Acceptance criteria satisfied

✓ Build passes

✓ Lint passes

✓ Typecheck passes

✓ No TypeScript errors

✓ RTL verified

✓ Mobile verified

✓ Dark mode verified

✓ Accessibility verified

✓ Loading states implemented

✓ Empty states implemented

✓ Error states implemented

✓ Success states implemented

✓ No schema violations

✓ No TODO comments

✓ No placeholders

✓ No mock data

✓ Review reports completed

---

# Hard Stop Rules

Immediately stop and ask for clarification if:

* A schema change is requested
* A migration is requested
* A SQL file must be created
* A column rename is requested
* A future phase is being implemented
* Requirements conflict with CLAUDE.md
* Required project documentation is missing

Never guess.

Escalate the conflict.

---

# Quality Principles

Quality over speed.

Architecture before implementation.

Design before coding.

Accessibility by default.

Arabic-first.

RTL-first.

Mobile-first.

Production-grade always.

One phase at a time.
