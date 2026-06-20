# Bayan Build Phases

Built one phase at a time. Use `/start-phase <number>` to begin a phase and `/finish-phase` to
close it out. Never skip ahead — each phase assumes the previous ones are done and approved.

| # | Phase | File |
|---|---|---|
| 1 | Foundation (Next.js/RTL/locale/theme setup) | `01-foundation.md` |
| 2 | Supabase Integration | `02-supabase-integration.md` |
| 3 | Design System (component library) | `03-design-system.md` |
| 4 | Localization & RTL | `04-localization-rtl.md` |
| 5 | Authentication | `05-authentication.md` |
| 6 | Dashboard (admin/teacher/student) | `06-dashboard.md` |
| 7 | Student Management | `07-student-management.md` |
| 8 | Reading Content Management | `08-reading-content-management.md` |
| 9 | CSV/XLSX Import & Export | `09-csv-xlsx-import-export.md` |
| 10 | Reading Fluency (sessions, WPM, accuracy) | `10-reading-fluency.md` |
| 11 | Read With Me (reader + vocabulary) | `11-read-with-me.md` |
| 12 | Settings | `12-settings.md` |
| 13 | Reading Analytics | `13-reading-analytics.md` |
| 14 | Performance | `14-performance.md` |
| 15 | Accessibility Audit | `15-accessibility-audit.md` |
| 16 | Testing | `16-testing.md` |
| 17 | Security Review | `17-security-review.md` |
| 18 | Reporting (incl. PDF) | `18-reporting.md` |
| 19 | Deployment | `19-deployment.md` |
| 20 | Final Refactor | `20-final-refactor.md` |

## Workflow rules (apply to every phase)

1. Work on **one phase at a time**, only the phase explicitly requested.
2. Before implementing anything user-facing, run the design process (see
   `.claude/skills/design-pass/SKILL.md` and `.claude/rules/design-system.md`).
3. At the end of a phase: stop, summarize, explain the architecture, give a review checklist,
   and wait for approval — this is what `/finish-phase` produces.
4. Never continue automatically into the next phase.
