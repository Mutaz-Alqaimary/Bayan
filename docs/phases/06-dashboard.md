# Phase 6 — Dashboard

## Goal
Build the three role-specific dashboards, the centerpiece of the "premium SaaS, not generic
CRUD" bar. Run the full design process (`design-pass` skill) before implementing.

## Build
- Admin Dashboard
- Teacher Dashboard
- Student Dashboard
- KPI Cards
- Reading Metrics Overview
- Recent Activity
- Quick Actions
- Progress Summary

## Per-role content
See `.claude/rules/design-system.md` → Dashboards, and `docs/PRD.md` → Core business goal.
- **Admin**: KPI cards, student statistics, reading analytics, system overview, quick actions.
- **Teacher**: student progress, reading performance, vocabulary progress, recent activity,
  reading insights.
- **Student**: reading progress, reading history, vocabulary growth, reading goals, personal
  analytics.

## Definition of done
- Each dashboard answers its role's core question at a glance (e.g. a teacher can spot a
  struggling reader without digging).
- Real data shape from `reading_sessions`/`students`/`vocabulary_terms` — no mock data.
- Loading skeletons match final layout (no layout shift), empty states for new
  accounts/no-data-yet.
