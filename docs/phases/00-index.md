# Bayan Build Phases

Built one phase at a time. Use `/start-phase <number>` to begin a phase and `/finish-phase` to
close it out. Never skip ahead — each phase assumes the previous ones are done and approved.

> **Current state:** Phases **1 → 13 are complete** (13 implemented — awaiting the owner's manual
> visual testing). Phase 14 (Performance) is next. For how the project actually works *today* (not the
> per-phase specs), read the single source of truth:
> [`docs/project/current-architecture.md`](../project/current-architecture.md). Manual Supabase config
> that isn't in SQL lives in
> [`docs/database/manual-supabase-configuration.md`](../database/manual-supabase-configuration.md).

| # | Phase | File | Status |
|---|---|---|---|
| 1 | Foundation (Next.js/RTL/locale/theme setup) | `01-foundation.md` | ✅ Done |
| 2 | Supabase Integration | `02-supabase-integration.md` | ✅ Done |
| 3 | Design System (component library) | `03-design-system.md` | ✅ Done |
| 4 | Localization & RTL | `04-localization-rtl.md` | ✅ Done |
| 5 | Authentication | `05-authentication.md` | ✅ Done (registration expanded in 12.5) |
| 6 | Dashboard (admin/teacher/student) | `06-dashboard.md` | ✅ Done |
| 7 | Student Management | `07-student-management.md` | ✅ Done (identity/email/status added in 12.5) |
| 8 | Reading Content Management | `08-reading-content-management.md` | ✅ Done |
| 9 | CSV/XLSX Import & Export | `09-csv-xlsx-import-export.md` | ✅ Done |
| 10 | Reading Fluency (sessions, WPM, accuracy) | `10-reading-fluency.md` | ✅ Done |
| 11 | Read With Me (reader + vocabulary) | `11-read-with-me.md` | ✅ Done |
| 12 | Settings | `12-settings.md` | ✅ Done |
| 12.5 | Student Identity & Roster Integration | `12.5-student-identity-and-roster-integration.md` | ✅ Done |
| 12.6 | Role Management + Profile Editing | `12.6-role-management.md` | ✅ Done (awaiting manual testing) |
| 13 | Reading Analytics | `13-reading-analytics.md` | ✅ Done (awaiting manual testing) |
| 14 | Performance | `14-performance.md` | Planned |
| 15 | Accessibility Audit | `15-accessibility-audit.md` | ✅ Done (awaiting manual AT testing) |
| 16 | Testing | `16-testing.md` | ✅ Done (Vitest suite — 146 tests; awaiting owner review) |
| 17 | Security Review (RLS tightening) | `17-security-review.md` | Planned |
| 18 | Reporting (incl. PDF) | `18-reporting.md` | Planned |
| 19 | Deployment | `19-deployment.md` | Planned |
| 20 | Final Refactor | `20-final-refactor.md` | Planned |

## Workflow rules (apply to every phase)

1. Work on **one phase at a time**, only the phase explicitly requested.
2. Before implementing anything user-facing, run the design process (see
   `.claude/skills/design-pass/SKILL.md` and `.claude/rules/design-system.md`).
3. At the end of a phase: stop, summarize, explain the architecture, give a review checklist,
   and wait for approval — this is what `/finish-phase` produces.
4. Never continue automatically into the next phase.
