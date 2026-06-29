# Phase 13 — Reading Analytics

> **Status: Implemented — awaiting the owner's manual visual testing.** Built across Milestones 1–6
> (design-pass → foundation → data layer → chart kit → UI/route/i18n → QA/docs). Build, typecheck, and
> lint pass; the route serves and gates correctly. Zero schema/Supabase/dependency changes. This spec
> was written against the **current** architecture (post Phase 12.5 identity redesign + Phase 12.6
> role/profile work) and supersedes the original short draft. For how the system works today, the
> single source of truth is [`docs/project/current-architecture.md`](../project/current-architecture.md);
> manual Supabase config is in
> [`docs/database/manual-supabase-configuration.md`](../database/manual-supabase-configuration.md).

## Goal

Turn `reading_sessions` history into **trends a teacher (or admin) can act on** — answering Bayan's
core product question, *"is the student's Arabic reading improving over time?"*, at both the cohort
and the individual-student level. Reading Analytics extends the existing dashboard aggregation layer
into a dedicated, drill-down `/analytics` surface; it does **not** rebuild or fork it.

---

## 1. Locked decisions (owner-approved)

These are final for Phase 13 and frame everything below.

1. **Charting: a dependency-free SVG chart kit.** No Recharts / Chart.js / visx / any charting
   library. Rationale: stays on the locked tech stack, no React 19 / Next 16 peer-dependency risk,
   total control over RTL rendering, better accessibility, easier long-term maintenance, and
   consistency with the existing [`Sparkline`](../../features/dashboard/components/sparkline.tsx) /
   [`MiniBars`](../../features/dashboard/components/mini-bars.tsx). **Final** unless a future phase
   needs functionality that genuinely cannot be built with SVG.
2. **Audience: Admin + Teacher only.** `/analytics` is gated to `admin` and `teacher`
   (`canAccessAnalytics`). Students are **not** given a dedicated analytics route — they already have
   the Dashboard, Reading History, and personal progress. Any future richer student analytics is
   **integrated into the existing Reading History experience**, never a new student route.
3. **Single source of truth for aggregation** (architectural invariant — see §8).
4. **Modular, extensible module + insights architecture** (reading now; vocabulary/teacher reserved —
   see §3, §5).
5. **Time-range-first data layer** (7d / 30d / 3m / all — see §6).
6. **Deterministic analytics** (Definition of Done — see §11/§DoD).
7. **No premature optimization** (performance philosophy — see §10).

---

## 2. What already exists (extend, never duplicate)

Phase 13 is mostly an **extension** of proven patterns. The following already exist and **must be
reused**:

- **Aggregation helpers** — [`features/dashboard/data/shared.ts`](../../features/dashboard/data/shared.ts):
  `average`, `isNumber`, `toNum`, `dailyCountsTrend`, `startOfWeek`, `AT_RISK_ACCURACY`,
  `STATS_SAMPLE_LIMIT`, and the recent-session view mapping. These are the **single source of truth**
  for how speed/accuracy/trends are computed (§8).
- **Identity-correct student resolution** — `getLinkedStudentId(profileId)`
  ([`features/reading/sessions/queries.ts`](../../features/reading/sessions/queries.ts)) and the
  `students.id`/`profile_id` model. Analytics resolves students by `profile_id`/`students.id`,
  **never by email** (Phase 12.5 invariant).
- **Fluency formulas** — [`features/reading/sessions/fluency.ts`](../../features/reading/sessions/fluency.ts)
  (`countWords`, `computeFluency`). Analytics reads the **already-stored** `words_per_minute` /
  `accuracy_percentage`; it never recomputes them.
- **Struggling-reader ranking** — `rankStrugglingReaders`
  ([`features/dashboard/data/teacher.ts`](../../features/dashboard/data/teacher.ts)) — the existing
  "Needs Attention" logic that the cohort overview's drill-down entry points build on.
- **SVG chart primitives** — `Sparkline`, `MiniBars` (dependency-free, `aria-hidden` + numeric
  fallback, RTL-aware) — the proven pattern the new chart kit follows.
- **Authorization** — `canAccessAnalytics` (admin + teacher),
  [`requireRole`](../../features/auth/guards.ts) ([`features/auth/roles.ts`](../../features/auth/roles.ts)).
- **Routing/nav** — `ROUTES.analytics` and the admin/teacher `analytics` nav item already exist
  (currently "coming soon"); Phase 13 adds the page and registers the route in `IMPLEMENTED_ROUTES`.
- **Formatting** — [`lib/format.ts`](../../lib/format.ts) (Western numerals, locale-aware) for all
  chart labels and figures.

> **Phase 13 therefore adds:** a new `/analytics` route, a new `features/analytics/` module
> (time-range-aware, full-history-capable reads that go a step beyond the dashboard's at-a-glance
> recent sample), a small reusable SVG chart kit, and a plain-language reading-insights engine — all
> on the existing schema with **no service-role use and no manual Supabase change**.

---

## 3. Module architecture (future-ready by design)

The feature is organized so additional analytics domains slot in **without refactoring**. Phase 13
builds only the **reading** module; **vocabulary** is reserved structure, not implementation.

```
features/analytics/
  types.ts                 # shared cross-module types (TimeRange, ReadingTrendPoint, AnalyticsInsight…)
  time-range.ts            # pure, deterministic window resolution (§6)
  reading/                 # BUILT in Phase 13
    queries.ts             #   server-only reads (cohort + per-student)
    insights.ts            #   deriveReadingInsights (pure)
    types.ts               #   CohortReadingAnalytics, StudentReadingAnalytics, …
  vocabulary/              # RESERVED — created when implemented in a future phase (§4). No stubs now.
    (queries.ts, insights.ts, types.ts)   # deriveVocabularyInsights lives here when built
  insights.ts              # deriveTeacherInsights — RESERVED cross-module cohort aggregator (§5)
  components/
    charts/                # dependency-free SVG kit: LineTrend, BarSeries, ChartFrame
    analytics-page.tsx     # client shell (range tabs, overview ↔ drill-down navigation state)
    time-range-tabs.tsx
    cohort-overview.tsx
    needs-attention.tsx
    student-card-grid.tsx  # / student list — primary drill-down entry (§7)
    student-analytics.tsx
    student-picker.tsx     # secondary search entry (§7)
```

Rules:

- The feature is **not** coupled to reading sessions as a whole-module assumption. Reading lives in
  `reading/`; a future `vocabulary/` is a **sibling**, sharing `types.ts`, `time-range.ts`, the chart
  kit, and the dashboard aggregation helpers.
- `vocabulary/` is **not created with empty stubs** in Phase 13 (no placeholder/dead code — project
  rule). It is a documented, reserved location so adding it later is purely additive.
- The chart kit and time-range layer are **domain-agnostic** so vocabulary analytics reuse them
  as-is.

---

## 4. Vocabulary Analytics (future-ready, NOT built in Phase 13)

The architecture explicitly anticipates vocabulary becoming an analytics domain. **Reserved, not
implemented now.** Potential future metrics (illustrative — exact set decided in that phase):

- Vocabulary growth over time
- New words encountered / learned
- Unknown words over time
- Mastered-vocabulary progression
- Review-completion trends

How it attaches without restructuring:

- A `features/analytics/vocabulary/` module mirroring `reading/` (`queries.ts`, `insights.ts`,
  `types.ts`), keyed by the same identity model (`students.id` / `profile_id`, never email).
- Reuses the shared `TimeRange`, the SVG chart kit, and the dashboard aggregation helpers.
- Surfaces as an additional section/tab on the existing `/analytics` page — no new route, no change
  to the reading module.
- Today's vocabulary data is a **reading aid** (`vocabulary_terms`: word + meaning) with **no
  per-student progress/mastery/review tracking in the locked schema**. Any metric that needs
  per-student vocabulary state would require data the schema does not currently hold — so that phase
  must first confirm what is representable on the locked schema (**no schema changes**) and STOP-and-flag
  if a metric would require new tables/columns. This spec only guarantees the *architecture* is ready,
  not that every listed metric is computable today.

---

## 5. Insights architecture (modular, extensible)

Insights are **not** one monolithic function. Each analytics domain owns a **pure** insight engine,
plus a cross-module cohort aggregator for teachers:

```
deriveReadingInsights()       # features/analytics/reading/insights.ts   — BUILT in Phase 13
deriveVocabularyInsights()    # features/analytics/vocabulary/insights.ts — RESERVED (future)
deriveTeacherInsights()       # features/analytics/insights.ts           — RESERVED (future cohort aggregator)
```

- **Phase 13 builds `deriveReadingInsights` only.** It is **pure and framework-agnostic** (the way
  [`fluency.ts`](../../features/reading/sessions/fluency.ts) is) — input rows in, structured
  `ReadingInsight[]` out — so it is trivially testable (Phase 16) and deterministic (§11).
- Output is **plain, actionable language**, not raw numbers — e.g. *"تحسّنت السرعة بمقدار ١٢ كلمة/د
  خلال آخر ٥ جلسات"* / *"accuracy dropped over the last 3 sessions."* The engine emits **structured,
  localizable insight descriptors** (a type + interpolation values), and the UI renders the localized
  string via next-intl (correct BiDi; never string concatenation).
- `deriveVocabularyInsights` (future) and `deriveTeacherInsights` (future cohort/cross-module
  aggregator that composes the per-domain engines) have **named, reserved homes** so they are added
  without restructuring. They are not stubbed now.

---

## 6. Time-range filters (designed in from the start)

The data layer is built around **selectable time ranges**, not a full-history-only assumption.

```
TimeRange = "7d" | "30d" | "3m" | "all"
```

UI: Last 7 Days · Last 30 Days · Last 3 Months · All Time (default decided in design-pass; likely
30d).

- **Pure, deterministic windowing** — `time-range.ts` exposes a pure
  `resolveAnalyticsWindow(range, now): { start: Date | null; end: Date }` that takes `now` as an
  **explicit parameter** (same discipline as `startOfWeek(now)`), so the function never reads the
  clock internally → deterministic and testable (§11). `"all"` → `start = null` (no lower bound).
- **Selection is server-resolved, not hidden client state.** The selected range is a URL search
  param read by the server component; changing it re-fetches. No client-side state silently alters
  reported statistics (§11).
- Time bucketing (daily/weekly/monthly granularity per range) is derived **deterministically** from
  the resolved window; series are returned oldest → newest as `ReadingTrendPoint[]` for the chart kit.

---

## 7. Student drill-down UX (data-driven, not picker-first)

The **primary** workflow is clicking through from overview data; a search field is **secondary**.

```
Analytics Overview  (cohort trends: WPM, accuracy, activity, distribution + range tabs)
        ↓
Needs Attention     (ranked weakest readers — extends rankStrugglingReaders)
        ↓
Student Cards / List (clickable cohort entries)
        ↓
Click a student
        ↓
Student Analytics    (that student's WPM / accuracy / duration trends + reading insights)
```

- Clicking a student from Needs Attention or the student cards/list is the **main path** into the
  per-student view.
- A **student picker / search** (Arabic-aware, reusing the students search pattern) also exists for
  direct lookup, but it is the secondary entry point — the overview is the front door.
- Per-student view resolves by `students.id` (reached via the roster/`profile_id`), **never email**.

---

## 8. Single source of truth (architectural invariant)

> **Shared aggregation helpers remain the single source of truth. Analytics must extend existing
> calculations rather than duplicate or fork dashboard logic.**

Concretely:

- Analytics **imports** `average` / `isNumber` / `toNum` / `dailyCountsTrend` / `startOfWeek` /
  `AT_RISK_ACCURACY` from [`features/dashboard/data/shared.ts`](../../features/dashboard/data/shared.ts).
  It does **not** re-implement them.
- If analytics needs a calculation that doesn't exist yet, it is **added once** to the shared layer
  (lifting it to a more neutral shared location if it's no longer dashboard-specific) and consumed
  from there — **never copy-pasted** into `features/analytics/`.
- The fluency definition (WPM/accuracy) stays owned by
  [`fluency.ts`](../../features/reading/sessions/fluency.ts); analytics reads stored values and never
  forks the formula.
- The "needs attention" ranking extends the existing `rankStrugglingReaders` logic rather than a
  parallel implementation.

Reviews (code-reviewer) must reject any duplicated/forked aggregation as a blocker.

---

## 8a. Layering rules (view models, presentation-only charts, testability)

Three refinements that keep the UI decoupled from the database and the logic testable.

### Stable, strongly-typed view models

> **Analytics queries always return stable, strongly-typed view models. UI components never consume
> raw database rows directly.**

- Every analytics read returns a resolved view model — e.g. `CohortAnalyticsData`,
  `StudentAnalyticsData` (and `ReadingTrendPoint[]`, `ReadingInsight[]`) — **never** raw
  `reading_sessions` / `students` rows.
- Names/passage titles are already locale-resolved, numerics already coerced (`toNum`), trends
  already bucketed — so components render, they don't transform. This mirrors the existing
  dashboard `…View` / `…Data` discipline (`RecentSessionView`, `StudentInsightView`,
  `ReadingHistory`) and keeps the UI **independent of database structure**: a schema/query change
  stays contained in the data layer behind a stable view-model contract.
- View models must be **clean and serializable** (no Supabase row handles, no `Date` objects that
  complicate the Server→Client boundary — pass ISO strings/numbers) so the same shapes are reusable
  by Phase 18 reporting/export without rework.

### Presentation-only charts

> **Chart components are presentation-only.**

- All aggregation, calculations, trend detection, business logic, and number/label **formatting**
  live in the analytics **data layer** (`reading/queries.ts`, `time-range.ts`, `insights.ts`, shared
  helpers). Chart components in `components/charts/` receive **already-prepared data** and simply
  render it (axes, points, bars, RTL direction, a11y fallback).
- Charts therefore contain **no data fetching and no domain logic** — making them trivially
  reusable across reading (and future vocabulary) analytics, and trivially substitutable if the
  visual approach ever changes. A chart that computes an average or formats a metric itself is a
  code-reviewer blocker.

### Testability

> **Analytics calculations should be implemented as pure functions whenever practical to enable
> straightforward unit testing in future phases.**

- Trend bucketing, distributions, ranking, window resolution (`resolveAnalyticsWindow`), and the
  `derive…Insights` engines are **pure functions of their inputs** — no I/O, no clock reads (`now`
  passed in), no hidden state. This complements the **determinism** requirement (§11) and sets up
  Phase 16 (Testing) to unit-test the analytics math directly, without a database or a rendered
  component.

---

## 9. Data layer, types & naming

New, server-only reads in `features/analytics/reading/queries.ts` (`import "server-only"`), gated by
`requireRole("admin", "teacher")`:

- `getCohortReadingAnalytics(range)` — platform/class WPM & accuracy trends over the range, sessions
  activity per period, accuracy distribution, and the "needs attention" list.
- `getStudentReadingAnalytics(studentId, range)` — one student's WPM / accuracy / duration trends,
  passages read, vocabulary exposure (reading-aid count, as today), and `deriveReadingInsights`
  output.

Access path & security:

- `reading_sessions` / `students` SELECT are permissive (`using(true)`), so admin+teacher read
  cross-student with the **session client** (`supabaseServerClient`) and **scope in-query** — exactly
  as the dashboards do. **No service-role client, no new privilege, no manual Supabase change.**
  (Tightening these permissive policies remains Phase 17 scope and is out of scope here.)
- Reads are **bounded** (reuse `STATS_SAMPLE_LIMIT` / sane caps) consistent with the dashboard layer
  and the performance philosophy (§10).

Proposed names (to be recorded in [`.claude/rules/naming-conventions.md`](../../.claude/rules/naming-conventions.md)
as the single source of truth **before** coding, following the established `<Entity>View` /
`get<Domain>` / `build…`/`derive…` conventions):

```
// time-range.ts — pure, deterministic windowing (§6)
TimeRange / TIME_RANGES / DEFAULT_TIME_RANGE / isTimeRange  // features/analytics/time-range.ts
AnalyticsWindow / resolveAnalyticsWindow                     //   selected window { start: Date|null; end: Date }
resolveComparisonWindow                                      //   preceding equal-length window (null for "all") — §11a.1
BucketGranularity / resolveBucketGranularity                 //   "day" | "week" | "month" per range

// types.ts — shared, generic, chart-facing building blocks
TrendDirection / TrendIndicator                             // KPI direction (§11a.1)
ChartSummary                                                // no-hover chart summary (§11a.2)
AnalyticsTrendPoint / AnalyticsTrendSeries                  // a chart-ready series (points + summary)
AnalyticsAvailability                                       // "ready" | "empty_all" | "empty_range" (§11a.4)
AnalyticsInsight / AnalyticsInsightSeverity                 // base structured, localizable insight descriptor

// reading/ — reading-domain composites (Milestone 3)
ReadingInsight / ReadingInsightKind                         // features/analytics/reading/types.ts
StudentAnalyticsCard                                        //   rich cohort card (§11a.3)
CohortReadingAnalytics / StudentReadingAnalytics           //   discriminated by AnalyticsAvailability
getCohortReadingAnalytics / getStudentReadingAnalytics     // reading/queries.ts (server-only)
deriveReadingInsights                                       // reading/insights.ts (pure)
computeTrendIndicator / summarizeTrend / bucketSeries       // features/analytics/aggregate.ts (pure, shared; reuse dashboard shared.ts)

// components/charts/ — presentation-only SVG kit (Milestone 4)
LineTrend / BarSeries / ChartFrame                          // features/analytics/components/charts/
ROUTES.analytics (already exists) → add to IMPLEMENTED_ROUTES
// RESERVED (future, not built in Phase 13):
deriveVocabularyInsights  // features/analytics/vocabulary/insights.ts
deriveTeacherInsights     // features/analytics/insights.ts
```

i18n: a new `analytics.*` namespace in `messages/{ar,en}.json`, Arabic-first, including templated
insight strings (interpolated values for correct BiDi).

---

## 10. Performance philosophy (documented)

> **No premature optimization. Prefer architectural simplicity. Performance optimizations — caching,
> pagination, and heavy aggregation improvements — belong to Phase 14 unless a clear bottleneck is
> discovered during implementation.**

Phase 13 uses the same "read bounded rows, aggregate in TypeScript" approach as the dashboards (the
locked schema has no analytics views/RPCs, and Phase 13 adds none). Full-history, time-bucketed
aggregation over a growing `reading_sessions` is the known cost and is **explicitly deferred to Phase
14 (Performance)** — consistent with the already-documented Phase 14 deferrals — rather than
pre-optimized now. If a real bottleneck surfaces during implementation, it is flagged, not silently
worked around.

---

## 11. Deterministic analytics

> **Analytics calculations must be deterministic. The same input data must always produce identical
> outputs. No hidden client-side state may affect reported statistics.**

How this is guaranteed:

- All derivations (`deriveReadingInsights`, trend bucketing, distributions) are **pure functions** of
  their inputs. Any dependence on "now" is passed in **explicitly** (`resolveAnalyticsWindow(range,
  now)`), never read from the clock inside a pure function.
- The selected time range and student selection are **server-resolved from URL params**, so the
  rendered statistics are a pure function of (data, range, student) — there is no client-only state
  that can change what the numbers say.
- Ordering is **stable** (deterministic sort keys, e.g. accuracy then WPM then id) so equal inputs
  always render identically.
- This directly enables Phase 16 testing and long-term reliability.

---

## 11a. Approved UX refinements (post-design-pass)

Owner-approved refinements from the Milestone-1 design review. They shape the **view models**
(§9 / `types.ts`) and the UI, and are part of the implementation contract.

1. **KPI trend indicators.** Every KPI communicates **direction**, not just a value: current value +
   change (absolute and/or %) vs. a **comparison period** (the immediately-preceding equal-length
   window — §6 `resolveComparisonWindow`). Encoded once as a typed `TrendIndicator`
   (`current/previous/delta/deltaPercent/direction/comparable`). When no comparison exists (range
   `all`, or no prior data) `comparable=false` and the UI shows the value without a misleading delta.
2. **Chart summaries (no hover required).** Every chart is understandable without interaction: it
   carries a small `ChartSummary` (`current / previous / change / changePercent / highest / lowest /
   direction`) rendered beside the SVG. Users never have to interpret the line alone. This pairs with
   the existing `aria-hidden` chart + numeric fallback (§12) — the summary *is* part of that fallback.
3. **Rich student cards (compact dashboards).** Cohort student entries are `StudentAnalyticsCard`
   view models — name, grade, avg WPM, avg accuracy, a trend indicator, and a risk badge (when
   `≤ AT_RISK_ACCURACY`) — so a teacher can compare students *before* drilling in. Each card is still
   a link into the per-student view (§7).
4. **Two distinct empty states** (`AnalyticsAvailability`): **`empty_all`** = no reading data exists
   at all ("no reading sessions yet") vs. **`empty_range`** = data exists but **none in the selected
   range** → copy guides the user to **try a wider range** (and never implies the student has no
   history). The query distinguishes them by checking existence outside the window.
5. **Reserve space for future modules.** The Student Analytics layout has a natural extension point
   so future sections — **Vocabulary Analytics**, **AI Insights**, **Assignments** (§14) — slot in
   **without redesign**. The `StudentReadingAnalytics` "ready" view model can later gain optional
   `vocabulary?` / `aiInsights?` / `assignments?` sections additively. **No placeholders/stubs are
   built now** (project rule) — only the layout and types stay open to extension.

### Type-architecture refinements (post-Milestone-2, applied to `types.ts`)

6. **`TrendDirection` is `up | down | neutral`** — a zero/negligible change (within a data-layer
   deadband) is `neutral`, never forced into a misleading up/down.
7. **`AnalyticsTrendPoint` carries a stable `bucketId`** (granularity-encoded, e.g. `2026-W26`)
   distinct from the display `label` and the machine `date` (ISO) — presentation stays independent of
   the time-bucket implementation.
8. **Missing comparison data is `null`, never `0`.** `null` = "not enough historical data";
   `0` = a real measured value. `TrendIndicator.previous`/`delta`/`deltaPercent` are nullable and the
   aggregation layer must never substitute `0` for missing.
9. **Reserved future types are strongly typed, not `any`/`unknown`.** `VocabularyAnalyticsSection` /
   `AiInsightsSection` / `AssignmentsAnalyticsSection` are declared now as type contracts (keyed on
   `AnalyticsAvailability`, reusing the shared kit) — **no runtime, no stubs** — so the extension
   points (§11a.5) communicate their intended shape today and are finalized in their own phases.

### Type-architecture refinements (post-Milestone-3, applied to the data layer)

10. **Configurable trend deadband.** The neutral band is the exported, named
    `TREND_NEUTRAL_THRESHOLD` (in `aggregate.ts`) — one adjustable knob, not a literal buried in the
    calculation.
11. **The view model owns all bucket info.** `AnalyticsTrendPoint` already carries `bucketId` +
    `date` + pre-localized `label`; the data layer decides day/week/month
    (`resolveBucketGranularity`). **Chart components never receive a granularity** — they render the
    supplied series and its labels, nothing more.
12. **Insight kinds are a strongly-typed union** (`ReadingInsightKind`), narrowing the shared
    `AnalyticsInsight.kind` — never stringly-typed at the reading-domain layer.
13. **`StudentAnalyticsCard` stays independent.** It is its own reusable view model; the cohort
    model **composes** it (`needsAttention` / `students`) and the per-student model does **not** inherit
    from it — composition over inheritance.
14. **One search-param contract.** `parseAnalyticsSearchParams()` + `ANALYTICS_RANGE_PARAM` /
    `ANALYTICS_STUDENT_PARAM` (`search-params.ts`) centralize `range`/`student` parsing and key names,
    so the route, range tabs, and student links never duplicate parsing logic.

### Chart-kit refinements (post-Milestone-4)

15. **Chart theme-token system.** Beyond `--chart-1..5`, the kit themes off reserved tokens
    `--chart-grid` / `--chart-axis` / `--chart-text` (light + dark in `globals.css`) so charts and
    future analytics modules stay visually consistent. Series accept an optional `color` prop
    (default `--chart-1`).
16. **`ChartFrame` metadata.** Optional `title` / `description` render an sr-only `<figcaption>`
    (accessible figure name today; room for a future visible caption).
17. **Extensible `ChartSummary`.** Optional `sampleCount` / `periodCount` (populated by
    `summarizeTrend`) convey how representative a statistic is — reserved, not shown in the UI yet.
18. **Multi-series-ready geometry.** `scale.ts` stays per-value/per-index so a future `MultiLineTrend`
    reuses the same geometry (combined `valueBounds`, per-series `color`) with no architectural change.

---

## 12. Required states (every view)

Per [`design-system.md`](../../.claude/rules/design-system.md), every analytics view ships:

- **Loading** — skeleton charts/cards, no layout shift.
- **Empty (two kinds — §11a.4):** **`empty_all`** ("no reading sessions yet", with a sensible next
  action) vs. **`empty_range`** ("no sessions in this period — try a wider range"). Never a bare "no
  data," and never conflate the two.
- **Error** — friendly message + recovery, no raw stack traces.

Charts: each visual is `aria-hidden` and paired with an **accessible numeric/table fallback**;
**x-axis runs right→left in Arabic**; Western numerals via `lib/format.ts`; chart tokens
(`--chart-1…`) for dark-mode parity.

---

## 13. Implementation roadmap (when approved)

Nothing is built until this spec is approved; then, in order:

1. **Design-pass** ([`design-pass` skill](../../.claude/skills/design-pass/SKILL.md)) for `/analytics`
   and the per-student view: goals → UX → IA → layout → component hierarchy → responsive → a11y →
   then implement. (Mandatory before any user-facing code.)
2. **Naming** — record §9 names in `naming-conventions.md`.
3. **Shared layer** — `features/analytics/types.ts` + `time-range.ts` (pure, deterministic);
   reuse/extend dashboard `shared.ts` (never fork).
4. **Reading data layer** — `reading/queries.ts` (`server-only`, `requireRole('admin','teacher')`),
   `reading/types.ts`, `reading/insights.ts` (pure `deriveReadingInsights`).
5. **Chart kit** — `components/charts/` (`LineTrend`, `BarSeries`, `ChartFrame`), RTL + a11y + dark
   mode, built on the Sparkline/MiniBars pattern.
6. **UI** — `analytics-page.tsx` shell with range tabs, cohort overview, needs-attention,
   student cards/list (primary drill-down), student-analytics view, secondary student picker; full
   loading/empty/error states.
7. **Route** — `app/[locale]/(app)/analytics/page.tsx` + colocated `loading.tsx` + `error.tsx`,
   `requireRole('admin','teacher')`; add `ROUTES.analytics` to `IMPLEMENTED_ROUTES`.
8. **i18n** — `analytics.*` in `messages/{ar,en}.json` (Arabic-first), including insight templates.
9. **Reviews** — design-reviewer → code-reviewer → a11y-auditor → qa-reviewer; fix blockers.
10. **Docs sync** — update `current-architecture.md` (analytics module + server-action/read inventory
    + Future Considerations) and `00-index.md` status.

---

## 14. Future Expansion

The analytics architecture must remain extensible for future modules **without restructuring**:

- **Vocabulary Analytics** — a `features/analytics/vocabulary/` sibling module + `deriveVocabularyInsights`
  + an additional `/analytics` section, reusing the shared time-range, chart kit, and aggregation
  helpers (§4). Subject to what the **locked schema** can represent (no schema changes).
- **Teacher / cohort insights** — `deriveTeacherInsights` as the cross-module cohort aggregator (§5).
- **Assignments / Classrooms** — these are part of the **future teacher workflow** (documented in
  Phase 12.6 / `current-architecture.md` §18) and attach via **separate extension tables keyed by
  `profiles.id` / `students.id`**, in their own phases; analytics over them becomes additional
  modules/sections, not a rewrite.
- **Reports / Export (incl. PDF)** — **Phase 18**. Reporting consumes the analytics data layer; it is
  **not** built here. The analytics queries should return clean, serializable view-models that a
  reporting layer can reuse.
- **AI-generated insights** — a future engine can sit alongside the pure `derive…Insights` functions
  (e.g. composing their structured output), without changing the data layer or the chart kit. Any
  such feature would default to the latest Claude models and follow the project's authorization and
  determinism rules (AI output is presentation, never a hidden input to the *reported statistics*).

**Invariant for all of the above:** new analytics modules reuse the shared aggregation helpers (§8),
resolve entities **by id, never email** (Phase 12.5), add **no schema changes**, and follow the
performance (§10) and determinism (§11) rules.

---

## Definition of Done

- Charts are correct in **RTL** (axis direction right→left, legend placement, Western-numeral
  formatting) — **verified explicitly**, not assumed.
- Insights are in **plain, actionable language** (e.g. "accuracy dropped over the last 3 sessions"),
  not raw numbers.
- **Two distinct empty states** (§11a.4): `empty_all` (no history at all) vs. `empty_range` (none in
  the selected range → guide to a wider range), never conflated — plus loading + error on every view.
- **Time ranges** (7d / 30d / 3m / all) work and are server-resolved.
- **KPI trend indicators** (§11a.1): each KPI shows direction + change vs. the comparison period, and
  degrades gracefully (`comparable=false`) when there is no prior period.
- **Chart summaries** (§11a.2): each chart is readable without hover (current/prev/change/high/low).
- **Rich student cards** (§11a.3): cohort cards show name, grade, avg WPM, avg accuracy, trend, and
  risk badge before drill-in.
- **Drill-down** works from overview/needs-attention/student-cards into per-student analytics
  (search is secondary).
- **Deterministic:** identical input data always yields identical reported statistics; no hidden
  client-side state affects the numbers.
- **Single source of truth respected:** no duplicated/forked dashboard aggregation logic (reviewer
  blocker if violated).
- **Stable view models:** queries return strongly-typed, serializable view models
  (`CohortReadingAnalytics` / `StudentReadingAnalytics` / `AnalyticsTrendSeries` / `ReadingInsight`);
  UI consumes **no raw DB rows**.
- **Presentation-only charts:** chart components contain no aggregation, business logic, formatting,
  or data fetching — they render already-prepared data (reviewer blocker if violated).
- **Pure analytics calculations:** trend/bucketing/ranking/window/insight functions are pure
  (testable in Phase 16), consistent with the determinism requirement.
- **Audience:** `/analytics` reachable only by admin + teacher (UI nav + route guard); no student
  analytics route added.
- **No schema changes, no migrations, no manual Supabase config, no service-role use.**
- Engineering gates: build / lint / typecheck clean; mobile + dark mode verified; keyboard +
  screen-reader + focus order correct in RTL; no TODOs / placeholders / mock data / dead code (no
  empty `vocabulary/` stubs).
- Review pipeline (design → code → a11y → qa) passed.

---

## Risks & trade-offs

| Risk / trade-off | Assessment & mitigation |
|---|---|
| **RTL charts** | Highest-attention DoD item. Mitigated by hand-built SVG (full control) + explicit verification; never assume a library handles it (there is none). |
| **Duplicating dashboard logic** | Forbidden (§8). Mitigated by importing/extending `shared.ts`; reviewer rejects forks. |
| **Scope creep** (student route, charting lib, vocabulary now) | Bounded by the locked decisions (§1): admin+teacher only, SVG only, vocabulary reserved-not-built. |
| **Full-history aggregation cost at scale** | Known; deferred to Phase 14 (§10). Bounded reads now; flag a real bottleneck if found. |
| **Vocabulary metrics vs. locked schema** | Some future vocabulary metrics need per-student state the schema lacks. Architecture is ready; that phase must confirm representability and STOP-and-flag rather than invent schema (§4). |
| **Over-structuring for the future** | Mitigated by reserving *structure and names* only — no empty stubs/dead code now; reading is the sole built module. |
