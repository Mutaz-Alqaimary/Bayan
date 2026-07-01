# Phase 18 — Reporting

> **This supersedes the original thin Phase 18 sketch.** The plan was re-derived from the current
> codebase (post-Phase 17) and owner-approved before implementation. This file is both the approved
> spec and the implementation record.

## Goal

Turn the Phase 13 reading analytics into **shareable, print-ready reports** an admin or teacher can
hand to a parent or an administrator — with correct Arabic shaping and RTL — **without any schema,
Supabase, RLS, or new-dependency change**.

## The one architectural rule

**Reporting is a presentation layer over the existing Phase 13 analytics view models. It is NOT a
second analytics implementation and it does not duplicate aggregation logic.** Every metric, trend,
chart series, insight, and empty-state distinction is the reused output of
`getCohortReadingAnalytics` / `getStudentReadingAnalytics`; reporting only wraps those view models
with document metadata and renders them as a print-optimized document.

## Scope

**In scope — two report types, matching the two Phase 13 reads:**

1. **Program / Cohort Report** (administrator-facing) — whole-cohort KPIs, WPM/accuracy/activity
   trend charts, and a print-friendly per-student summary **table** with an at-risk status column.
2. **Student Progress Report** (parent-facing) — one student's KPIs, WPM/accuracy/duration charts,
   plain-language insights, and recent sessions.

**Primary format:** the browser's native **Print → Save as PDF** of a print-optimized document.
No PDF library, no server-side generation (no Puppeteer/Playwright/jsPDF). Arabic shaping and RTL
come from the browser's own print engine, so the printout matches the on-screen document exactly.

**Explicitly out of scope** (each would need schema/infra that belongs to a later phase): XLSX
export, reading-goal reports, class/section reports, teacher-performance/evaluation reports, saved /
scheduled / emailed reports, persisted PDF archive. Cohort = whole platform (there is no
teacher↔student assignment table — same reality as Phase 13).

## Database / Supabase / RLS

**No change of any kind.** No tables, columns, migrations, views, materialized views, RPCs, indexes,
triggers, buckets, auth settings, or env vars. Reporting reads the same tables Phase 13 reads,
through the same **session client** under the same Phase 17 RLS (`is_staff()`), gated by
`requireRole("admin","teacher")` + `canAccessReports`. No service-role, no new privilege, no new
attack surface. The existing `idx_reading_sessions_*` indexes already cover the (bounded,
`ANALYTICS_SESSION_LIMIT`) reads inherited from analytics.

## What was built (`features/reporting/`)

| File | Role |
| --- | --- |
| `types.ts` | `ReportKind`, `ReportMeta`, `CohortReport`, `StudentReport`, `Report` — the analytics view models + document metadata. |
| `report-meta.ts` | **Pure** composition: `buildReportMeta` (normalizes the byline, passes `generatedAt` through — no clock read). |
| `report-meta.test.ts` | Unit tests for the pure core (deterministic `generatedAt` passthrough, byline normalization). |
| `queries.ts` | Server-only `getCohortReport` / `getStudentReport` — call the Phase 13 queries, take the staff byline from the `SessionUser` **`requireRole` already returns** (no extra `getSessionUser` round-trip), inject `generatedAt` once. Role-gated (defense in depth). |
| `components/report-page.tsx` | The `/reports` shell (toolbar + document); all state in the URL. |
| `components/report-toolbar.tsx` | On-screen builder controls (range + scope + print); `print:hidden`. |
| `components/report-document.tsx` | Dispatches cohort/student body; the printable `<article>`. |
| `components/report-header.tsx` | The printed document header (brand, title, range, generated-at, prepared-by). |
| `components/cohort-report-body.tsx` | Cohort KPIs + charts + summary table (reuses analytics primitives). |
| `components/student-report-body.tsx` | Student KPIs + charts + insights + recent sessions (reuses analytics primitives). |
| `components/print-button.tsx` | `"use client"` — the only interactive control; calls `window.print()`. |
| `components/print-button.test.tsx` | Component/RTL/a11y test (real AR/EN copy, print dialog, axe-clean). |

**Reuse (no forks):**
- The Phase 13 **view models** and their two empty states (`empty_all` / `empty_range`), unchanged.
- The presentation primitives `AnalyticsKpi`, `TrendChartCard`, `InsightsList`, the SVG chart kit,
  and `SectionCard`.
- The URL-param contract (`parseAnalyticsSearchParams` + the shared param keys).
- `TimeRangeTabs` and `StudentPicker` were generalized with an optional `pathname` prop (default
  `ROUTES.analytics`) so the identical range selector and student lookup drive `/reports` with **no
  duplicated chrome**; analytics callers are unaffected.
- `formatInsightValues` was extracted from the Phase 13 student view into
  `features/analytics/components/insight-items.ts` and reused by both surfaces, so the
  Western-numeral insight-formatting rule lives in exactly one place.

**Routing / nav:** `app/[locale]/(app)/reports/{page,loading,error}.tsx`; `ROUTES.reports` added to
`IMPLEMENTED_ROUTES` — the pre-existing `reports` nav item (admin/teacher, `FileText`) now links
instead of showing "coming soon". An unknown `?student=` id renders `notFound()`.

## PDF via browser print

The report document carries `data-report-print-root`, and a print block in `app/globals.css` is
**scoped entirely behind `body:has([data-report-print-root])`** — so the print styles apply *only*
when a report is on the page and **printing any other page of the app is unaffected** (no global
print behavior). The block:
- isolates the document with the visibility technique (hide everything, reveal only the
  `[data-report-print-root]` subtree), so the app shell and the on-screen toolbar never print —
  without tagging each of them;
- forces the **light** token palette at body scope (dark-on-white) regardless of the on-screen
  theme, so a report printed from dark mode still comes out paper-correct;
- preserves colours/borders (`print-color-adjust: exact`) so the SVG charts and the at-risk cue
  survive;
- sets `@page` margins and avoids page breaks inside KPI/chart cards and roster rows.

## Bug fixed while verifying layout — `ChartFrame` `sr-only` table (Phase 13 chart kit)

A large blank region appeared below the report on `/reports`. Live‑DOM measurement traced it to the
chart's **accessible data‑table fallback** in
[`features/analytics/components/charts/chart-frame.tsx`](../../features/analytics/components/charts/chart-frame.tsx):
the `<table>` carried `className="sr-only"`, but Tailwind's `sr-only` (`height:1px; overflow:hidden`)
does **not** collapse a `<table>` — tables size to content and don't clip — so with a 30‑day range
(~30 bucket rows) each hidden table stayed ~870–900px tall and, being `position:absolute`, protruded
past the real content and inflated the page's `scrollHeight` (a ~390–420px phantom gap). It surfaced
on `/reports` (not `/analytics`) only because the report is more compact, so the protrusion extended
past the shorter content instead of being covered by it. **Fix:** wrap the table in a
`<div className="sr-only">` (a div *does* collapse to 1×1px and clips its child) — the table stays in
the accessibility tree unchanged (verified: 30 rows still present; wrapper height 1px; page gap → 0).
This is a chart‑kit fix, so it also hardens `/analytics` and any future chart consumer. No cosmetic
`min-h`/`overflow` workaround was used.

## Accessibility (Phase 15-aligned)

Single `<h1>` per page (the report header title; the on-screen page has no competing heading);
semantic summary `<table>` with `scope="col"`/`scope="row"`; the at-risk status uses **icon + text**
(never colour alone), which is why it stays legible in a black-and-white printout; charts keep the
Phase 13 `ChartSummary` text alternatives; the Print button is a real keyboard-reachable `<button>`.
`print-button.test.tsx` is axe-clean and asserts real translated copy.

## Testing (Phase 16-aligned)

- **Unit (offline, deterministic):** `report-meta.test.ts` — byline normalization, `generatedAt`
  passthrough, `isAnalyticsReady`, title-key map.
- **Component/RTL/a11y (jsdom):** `print-button.test.tsx` — real AR/EN copy, `window.print()`
  invocation, axe-clean.
- The DB-bound report queries are not unit-tested (they only compose reused, already-tested Phase 13
  reads + a clock + `getSessionUser`), consistent with how the Phase 13 query functions are treated.

## Quality gates

`npx tsc --noEmit` ✓ · `npx eslint .` ✓ (0 errors; only the 4 pre-existing TanStack-Table React
Compiler warnings + 1 pre-existing test warning) · `npm run test` ✓ (156 passed) · `npx next build` ✓
(`/[locale]/reports` builds as a dynamic route).

## Definition of done

- [x] Student and Cohort reports render from **existing** data with no schema/RLS/Supabase change.
- [x] "PDF export" is browser Print → Save as PDF; Arabic shaping + RTL come from the print engine
      (verify in-browser in both locales/themes before demo — a common failure point).
- [x] Reports surface the Phase 13 analytics in a parent/admin-ready form.
- [x] Loading / empty (`empty_all` + `empty_range`) / error states present.
- [x] Staff-only; `requireRole` enforced in route **and** query.
- [x] Reporting nav enabled; `/reports` behaves like any other implemented module.
- [x] Build / lint / typecheck / tests green; naming + feature-based architecture respected.

## Manual verification checklist (before demo)

Open `/ar/reports` and `/en/reports`, in light and dark mode: pick a student, pick each range, then
Print (or the browser print preview) and confirm the PDF (1) hides the sidebar/topbar/toolbar,
(2) shapes Arabic correctly and lays out RTL, (3) prints dark-on-white with charts and the at-risk
cue visible, and (4) does not split a card/row awkwardly across pages.

## Future extensibility

New report types (vocabulary, class, teacher) attach as additional `ReportKind`s + bodies over their
view models when the backing data exists — the same additive pattern Phase 13 reserved. Server-side
PDF generation and persisted/scheduled/emailed reports remain future work (they require Chromium +
SMTP + a storage bucket + deploy changes) and are deliberately not started here.
