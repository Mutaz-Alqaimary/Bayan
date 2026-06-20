# Bayan — Product Requirements

Reference document. Not auto-loaded into every session — read it directly, or via
`/start-phase`, when you need full product context.

## What it is

Bayan is an Arabic-first literacy and reading-fluency platform. It helps schools, Arabic
language centers, and individual teachers improve students' Arabic reading skills through
reading passages, vocabulary learning, fluency tracking, analytics, and progress monitoring.

## Who uses it

- **Schools, Arabic language centers, Arabic literacy programs, individual teachers**
  (customers/organizations)
- **Roles**: admin, teacher, student

## User journeys

**Admin** — manages the platform, manages teachers, manages students, manages reading content,
reviews reports and analytics.

**Teacher** — manages students, creates and manages reading passages, creates and manages
vocabulary terms, reviews student progress, reviews reading analytics.

**Student** — reads passages, learns vocabulary, completes reading sessions, tracks personal
progress, views reading history.

## Core business goal

The platform must let a teacher answer: **"Is the student's Arabic reading ability improving
over time?"**

It must measure: reading speed, reading accuracy, reading duration, vocabulary exposure, and
reading progress trends — and surface that as something a busy teacher can read in seconds, not
a raw data dump.

## UX requirements

RTL-first, mobile-first, accessible. Teacher-friendly workflows, student-friendly reading
experience. Clear dashboards, simple navigation, fast page transitions, consistent design
language, readable Arabic typography, responsive layouts, touch-friendly interfaces, minimal
cognitive load, clear visual hierarchy.

## Success metrics

**Teachers should be able to:**
- Identify struggling readers
- Monitor reading improvement over time
- Track vocabulary growth
- Compare student progress
- Generate meaningful reports

**Students should be able to:**
- Improve reading fluency
- Learn new vocabulary
- Monitor personal progress
- Build reading confidence

## Design and engineering bar

See `.claude/rules/design-system.md` for the full visual/UX bar, and `.claude/rules/` generally
for the binding technical rules (schema, naming, architecture, RTL, code quality). This document
covers *what* Bayan is and *why*; `.claude/rules/` and `docs/phases/` cover *how* it gets built.
