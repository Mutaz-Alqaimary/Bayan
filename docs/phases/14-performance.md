# Phase 14 — Performance

> **Status: Planned — not yet started.** This spec was rewritten against the **current**
> architecture (post Phases 1→13, including the Phase 12.5 identity redesign, the Phase 12.6
> role/profile work, and Phase 13 Reading Analytics). It supersedes the original short draft, which
> was authored before any code existed and named the wrong targets. For how the system works today,
> the single source of truth is
> [`docs/project/current-architecture.md`](../project/current-architecture.md); manual Supabase
> config is in [`docs/database/manual-supabase-configuration.md`](../database/manual-supabase-configuration.md).
>
> **Guiding principle for this phase:** *measure first, change only what the measurement justifies,
> and document everything we deliberately did not change.* "Measured and intentionally left as-is" is
> an acceptable — often correct — outcome at school/demo scale.

---

## Phase overview

Phases 1→13 produced a feature-complete platform that is already performance-conscious by
construction: Server Components by default, leaf-level client boundaries, the **React Compiler is
on** (`reactCompiler: true` in [`next.config.ts`](../../next.config.ts)), fonts are optimized via
`next/font`, dashboard reads use `Promise.all` parallelism with `count: head` and bounded `limit`
queries, and charts are a dependency-free SVG kit (Phase 13). There is therefore **no broad
optimization sweep to perform.**

Phase 14 is deliberately **narrow and evidence-driven**. It establishes a measurement baseline, then
makes a small number of targeted improvements — chiefly removing **SheetJS (`xlsx`)** from the
Students route's first-load JavaScript, and resolving (or formally bounding) the two
`auth.users` full-scan reads that [`current-architecture.md` §16](../project/current-architecture.md)
explicitly defers to this phase. It changes **no schema, no SQL, no auth model, and no dependency
other than dev tooling**.

---

## Performance philosophy

This philosophy governs every implementation decision in Phase 14. When a choice is ambiguous,
fall back to these principles rather than to instinct or convention.

- **Evidence-driven, not assumption-driven.** We do not optimize what we *think* is slow; we
  optimize what the measurements *show* is slow. The bundle analyzer and recorded baselines are the
  arbiter, not intuition.
- **Every optimization must be justified by a real measurement.** No change ships without a
  before/after number in `docs/Performance.md`. A change we cannot quantify is a change we do not
  make in this phase.
- **Avoid unnecessary complexity.** Prefer the smallest, most local, name-preserving change that
  achieves the measured win. Caching layers, abstractions, and new boundaries are introduced only
  when measurement proves they earn their cost — never preemptively.
- **"Measured and intentionally left unchanged" is a successful outcome.** If an optimization offers
  little or no practical value at the app's real (school/demo) scale, the correct result is to record
  the measurement, document the reasoning, and leave the code as-is. A short, honest "we checked and
  it isn't worth it" is a deliverable — not a failure.

---

## Goals

1. **Establish a real baseline.** Run an actual bundle analysis and record route-level First-Load
   JS and the heaviest chunks — so every "after" claim is grounded in a number, not an assumption.
2. **Remove the one genuinely heavy client dependency from first paint.** Lazy-load `xlsx` so it is
   fetched only when a user actually imports/exports the roster.
3. **Resolve the deferred server-read cost.** Address (or formally document the bound of) the
   `listAllAuthUsers` full scan that runs on Student Management, `/teachers`, and the promote picker —
   using application-level techniques only.
4. **Document honestly.** Produce `docs/Performance.md` recording what was measured, what changed,
   and — equally important — what was deliberately *not* changed, and why.

---

## Current problems being addressed

1. **`xlsx` (SheetJS) is in the Students route's first-load bundle.** It is statically imported at
   module top in three client-reachable files —
   [`parse.ts:13`](../../features/students/import-export/parse.ts),
   [`export.ts:14`](../../features/students/import-export/export.ts),
   [`template.ts:11`](../../features/students/import-export/template.ts) — and pulled in eagerly via
   the `"use client"` import/export components even though import/export is an occasional action.
   SheetJS is large; this is the single biggest bundle win available.

2. **`listAllAuthUsers` performs a paginated full scan of `auth.users` on several loads.** It backs
   account-status derivation on every Student Management load
   ([`features/students/identity/queries.ts`](../../features/students/identity/queries.ts) →
   `getStudentAccountStatusMap`), and is reused by `getTeachers` / `getPromotableUsers` on every
   `/teachers` load and promote-picker open
   ([`features/teachers/queries.ts`](../../features/teachers/queries.ts)). `current-architecture.md`
   §16 explicitly assigns both to **Phase 14**. The bound is fine at school/demo scale, but it is
   the most concrete server-side cost in the app and must be resolved or formally documented.

3. **No measurement baseline exists.** The original spec's definition of done ("bundle analysis was
   actually run, not assumed") cannot be satisfied without first wiring up an analyzer and recording
   numbers.

---

## Scope

- Add `@next/bundle-analyzer` as a **devDependency**, gated behind an `ANALYZE` env flag so normal
  and production builds are completely unaffected.
- Capture and document a baseline: route-level First-Load JS, the largest shared chunks, and which
  routes carry `xlsx` / TanStack Table.
- **Lazy-load `xlsx`**: convert the three static `import * as XLSX from "xlsx"` sites to dynamic
  `await import("xlsx")` *inside the handler functions*. Locked function names and public signatures
  (`parseStudentImportFile`, `exportStudents`, `downloadStudentTemplate`) stay identical — only the
  import site moves.
- Re-run the analyzer and confirm `xlsx` has moved out of first-load JS into an async chunk; record
  before/after.
- Resolve the `listAllAuthUsers` deferral with an **application-level** approach (see Workstream 3),
  or formally document its bound and re-defer with a stated limit.
- Apply additional `next/dynamic` code-splitting **only** where the analyzer proves real weight.
- Create `docs/Performance.md`; update `current-architecture.md` §16/§17 to reflect resolved/re-deferred
  items.

---

## Explicitly out of scope (and why)

These are intentional non-goals. Future sessions should not "add them back" without a measured
justification.

- **`use cache` / `cacheLife` / `cacheTag` on authenticated reads.** Nearly every read is
  **cookie-bound and user-scoped** (`supabaseServerClient()` + `auth.getUser()`). Next's caching
  primitives are unsafe for per-user authenticated data — caching them risks cross-user leakage and
  would be an *architecture violation, not an optimization*. Caching is considered only for reads
  that are genuinely non-user-specific; if none qualify, this is documented as N/A, not forced.
- **Manual memoization (`useMemo` / `useCallback` / `memo`).** The **React Compiler is already
  enabled**; hand-memoization is explicitly discouraged by CLAUDE.md and would be redundant.
- **`next/image` migration for avatars.** The only images are avatars: WebP, ≤1 MB, dimension-capped,
  rendered via plain `<img>` ([`user-menu.tsx`](../../components/layout/user-menu.tsx),
  [`avatar-uploader.tsx`](../../features/settings/components/avatar-uploader.tsx)). There are no
  content/hero images. Migrating two tiny avatars to `next/image` (plus Supabase remote-pattern
  config) is marginal — **deferred unless the baseline proves otherwise.**
- **Font optimization.** Already handled via `next/font/google`
  ([`lib/fonts.ts`](../../lib/fonts.ts)).
- **Server Components / data-fetching "optimization" as a generic task.** SC-first is enforced
  architecturally and the dashboard layer already parallelizes and bounds its reads; there is no
  generic rework to do. Specific, measured hotspots only.
- **Re-implementing loading / empty / error states.** They are a per-phase Definition-of-Done
  requirement and already exist across the app; Phase 14 must not regress them, not rebuild them.
- **Speculative code-splitting** of TanStack Table or the SVG charts. The table is needed for first
  interaction on management pages (poor split candidate); the charts are dependency-free SVG (nothing
  to split). No splitting without analyzer evidence.
- **RLS tightening (Phase 17), accessibility (Phase 15), testing (Phase 16), broad refactor
  (Phase 20).** Out of scope here by phase discipline.

---

## Workstreams

### Workstream 1 — Measure (baseline)

- Add `@next/bundle-analyzer` (devDependency). Wire it in `next.config.ts` behind
  `process.env.ANALYZE` so it is inert for `dev`, `build`, and `start` unless explicitly invoked
  (e.g. `ANALYZE=true next build`).
- Capture the baseline **before changing anything**, then re-capture the identical metric set after
  Workstreams 2–3 so the comparison is apples-to-apples. The measurement set is fixed so the run is
  **reproducible** by any future session:

  | Metric | What to record | Source |
  | --- | --- | --- |
  | **Route-level First Load JS** | The First Load JS (KB) for every route, taken from the `next build` route table — with special attention to `/students`, `/teachers`, `/analytics`, `/reading-sessions`, `/dashboard`. | `next build` output |
  | **Largest shared chunks** | The biggest entries in the shared-by-all chunk group, by size, and what they contain. | `next build` output + analyzer treemap |
  | **Async (lazy) chunk sizes** | The size of each on-demand chunk, notably the `xlsx` chunk once it is split out. | Analyzer treemap (`ANALYZE=true next build`) |
  | **Per-route bundle composition** | Which modules dominate the `/students` (and other heavy) route bundles — used to confirm targets and catch surprises. | Analyzer treemap |
  | **`xlsx` placement** | Explicit verification of *which* chunk contains SheetJS — first-load vs. async — both before and after the change. | Analyzer treemap / chunk search |
  | **Build health** | Build/typecheck/lint pass and total build time (rough), to confirm no regression from the analyzer wiring. | `next build`, `eslint` |

- The reproducible command is documented in `docs/Performance.md` (`ANALYZE=true next build`), so the
  exact same numbers can be regenerated later.
- Record the baseline table in `docs/Performance.md` before any optimization lands.

### Workstream 2 — Bundle optimization (client)

- **Lazy-load `xlsx`**: move `import * as XLSX from "xlsx"` from module top into the handler bodies
  of `parse.ts`, `export.ts`, and `template.ts` as `const XLSX = await import("xlsx")`. The handlers
  are already invoked from `"use client"` components and are async-friendly; signatures and the
  locked names are unchanged.
- Re-run the analyzer; confirm SheetJS now lives in an async chunk and is absent from the Students
  route's first-load JS. Record before/after numbers.
- Audit other dialog-heavy flows (import, reconcile, activation-link) for `next/dynamic` **only if**
  the analyzer shows they carry meaningful first-load weight. No speculative splitting.

### Workstream 3 — Server read efficiency

Resolve the `listAllAuthUsers` deferral. **Constraint: no schema change** — sign-in data lives in
`auth.users` (off-limits), so the fix is application-level only. Options, in preference order:

1. **Request-level dedupe** — wrap `listAllAuthUsers` (or its callers) in React `cache()` so a single
   render that needs the auth-user/sign-in map more than once calls GoTrue only once per request.
2. **Short-TTL server cache** of the derived sign-in map — only if measurement shows it matters at
   realistic scale. The data is admin/teacher-gated and not user-specific, so a correctly-keyed cache
   does not leak across users.
3. **Document and bound** — if neither is justified at school/demo scale, record the explicit bound
   (`O(users / page)` admin calls, comfortable into the low thousands of users) and formally
   re-defer, updating §16.

This is a **measurement-driven** decision, not an automatic rewrite. Whichever path is taken,
`getStudentAccountStatusMap` / `getTeachers` / `getPromotableUsers` keep their current names,
signatures, and `profile_id`-based resolution.

### Workstream 4 — Documentation

Create `docs/Performance.md` as the **permanent historical record** of this phase. It must contain,
as explicit sections:

| Section | Contents |
| --- | --- |
| **Reproduction** | The exact command (`ANALYZE=true next build`) and what to read from it, so any future session can regenerate the numbers. |
| **Baseline measurements** | The full metric set from Workstream 1, captured before any optimization. |
| **Final measurements** | The same metric set re-captured after Workstreams 2–3. |
| **Before/after comparison** | A side-by-side delta for each metric (e.g. `/students` First Load JS before → after; `xlsx` chunk: first-load → async). |
| **Implemented optimizations** | What was changed, where, and the measured win for each. |
| **Optimizations intentionally not implemented** | Each non-change (authenticated-read caching, `next/image` for avatars, manual memoization, speculative splitting, etc.) with the measurement or reasoning that made it not worth doing. |
| **Technical rationale** | The "why" behind each decision — for both the changes made and the changes declined — so the record stands on its own. |
| **Deferred opportunities** | Performance work consciously pushed to later phases (see "Future performance work" below), with enough context for Phase 20 to pick it up. |

- Update `current-architecture.md` §16 (remove or re-bound resolved deferrals) and §17 as needed.
- Feed forward: the Phase 20 scaling chapter should *reference* this document, not re-derive it.

---

## Implementation order

1. **Workstream 1 (Measure)** — must come first; nothing else has a baseline otherwise.
2. **Workstream 2 (Bundle / `xlsx`)** — the highest-confidence, highest-value change.
3. **Workstream 3 (Server reads)** — measurement-driven; may resolve to "documented bound."
4. **Workstream 4 (Docs)** — finalize `Performance.md` and architecture sync last, once the real
   before/after numbers exist.

Workstreams 2 and 3 are independent and may each be landed and reviewed incrementally.

---

## Technical decisions

1. **Analyzer is `ANALYZE`-gated, development-only, and permanent.**
   - `@next/bundle-analyzer` is added strictly as a **development dependency** (`devDependencies`) —
     never a runtime or production dependency.
   - It is enabled **only** through the `ANALYZE` environment variable (`ANALYZE=true next build`).
     When the variable is unset, the analyzer wrapper is a pass-through and the config behaves
     exactly as it does today.
   - It is left in the project **permanently** as a standing development tool, so future performance
     investigations (e.g. Phase 20) can re-measure with zero setup.
   - It has **zero impact on normal development (`next dev`), normal builds (`next build`), or
     production builds/runtime** — it is tooling, not a tech-stack substitution.
2. **Dynamic import lives inside client handlers, not via `next/dynamic` boundaries**, for `xlsx`.
   The import/export entry points are already client components; moving the import site keeps the
   change minimal, SSR-safe, and free of new Suspense/boundary wiring.
3. **Locked names and signatures are preserved.** No renames; only import sites and (for server
   reads) internal caching/dedupe wiring change.
4. **Server-read fix is app-level only.** No schema, no stored sign-in column, no auth-model change —
   the identity invariant (`auth.users.id ↔ profiles.id ↔ students.profile_id`, resolve by
   `profile_id`) stays frozen.
5. **No optimization ships without a number.** Each change is backed by a before/after measurement in
   `docs/Performance.md`.

---

## Constraints

- **No database schema changes. No SQL migrations.** If a task appears to need one, STOP and flag it.
- **No auth/identity model changes.** The Phase 12.5 invariant and Phase 12.6 role rules are frozen.
- **No dependency changes** beyond the `@next/bundle-analyzer` devDependency.
- **No Phase 15 / 16 / 17 / 20 work.**
- **No speculative optimizations** — measurement justifies every change.
- **Keep the architecture exactly as it exists today** — Server Components first, leaf-level client
  boundaries, feature-based structure, React Compiler on.
- **No regressions** in RTL/LTR behavior, dark mode, or the required loading/empty/error states.

---

## Risks

| Risk | Handling |
| --- | --- |
| Schema is locked — the `listAllAuthUsers` cost can't be solved with a stored column. | App-level only (React `cache()` / TTL cache / documented bound). Stop-and-flag if a fix seems to need schema. |
| Caching authenticated, user-scoped reads could leak data across users. | Never apply `use cache` to cookie-bound reads. Cache only non-user-specific, admin-gated data with correct keys. |
| Lazy-loading `xlsx` could break import/export if the async import is mis-wired. | Keep the dynamic import inside the already-client handlers; verify import + export + template flows end-to-end after the change. |
| `@next/bundle-analyzer` leaking into prod builds. | Gate strictly behind `ANALYZE`; confirm `build`/`start` are byte-for-byte unaffected when the flag is unset. |
| Regression in RTL / dark mode / loading-empty-error states (explicit DoD). | Re-verify touched surfaces (Students, Teachers, Settings) in `ar` + `en` + dark mode. |
| Over-optimization for a school/demo-scale app. | "Measured and intentionally left as-is" is an accepted result; avoid changes without a number behind them. |
| Scope bleed into later phases. | Hold the line on 15/16/17/20 boundaries. |

---

## Dependencies

- **Upstream:** Phases 1→13 complete (they are). Relies on the existing import-export pipeline
  (Phase 9), Student Management / identity (Phases 7, 12.5), Teacher Management (Phase 12.6), and the
  dashboard/analytics read layers (Phases 6, 13) being in their current shape.
- **New tooling:** `@next/bundle-analyzer` (devDependency only).
- **Downstream:** Phase 20 (Final Refactor) scaling chapter references `docs/Performance.md` rather
  than re-deriving it.

---

## Future performance work (intentionally deferred)

Phase 14 is a **targeted, current-scale** performance pass. Larger, structural performance work is
deliberately **out of scope** and pushed to later phases — most of it to **Phase 20 (Final Refactor)**,
whose Definition of Done already calls for a scaling strategy grounded in what was actually built.
Recording these here draws a clear scope boundary so nobody mistakes their absence for an oversight:

- **Large-scale scalability improvements** — behavior as schools/students/passages/sessions grow into
  the tens of thousands: pagination limits, query-pattern review, and caching strategy at scale.
- **Database / query redesign** — schema and index strategy are locked and out of scope for the whole
  build; any production-scale data-access redesign is a future, separately-approved effort, not
  Phase 14.
- **List virtualization** — windowing for very large tables/lists (TanStack Table virtual rows). Not
  warranted at school/demo scale; revisit only if real datasets make it necessary.
- **Architecture refactoring for performance** — restructuring feature boundaries, data layers, or
  rendering strategy for throughput belongs to Phase 20's honest review, not here.
- **Server-read scaling beyond the `listAllAuthUsers` item** — broader caching/invalidation strategy
  for cross-`profiles`/`auth.users` reads, if the user base outgrows the documented bound.

Any of these may be promoted to a concrete task later **with measurement and approval** — but never
speculatively, and never inside Phase 14.

---

## Files / modules expected to change

| File / module | Expected change |
| --- | --- |
| [`package.json`](../../package.json) | Add `@next/bundle-analyzer` to `devDependencies`. |
| [`next.config.ts`](../../next.config.ts) | Wrap config with the analyzer behind an `ANALYZE` env gate (composed with the existing `withNextIntl`). |
| [`features/students/import-export/parse.ts`](../../features/students/import-export/parse.ts) | Move `xlsx` import into the handler (`await import("xlsx")`). |
| [`features/students/import-export/export.ts`](../../features/students/import-export/export.ts) | Same — lazy `xlsx`. |
| [`features/students/import-export/template.ts`](../../features/students/import-export/template.ts) | Same — lazy `xlsx`. |
| [`features/students/identity/queries.ts`](../../features/students/identity/queries.ts) | Possibly wrap `listAllAuthUsers` / `getStudentAccountStatusMap` in request-level dedupe (measurement-driven). |
| [`features/teachers/queries.ts`](../../features/teachers/queries.ts) | Possibly benefit from the same dedupe for `getTeachers` / `getPromotableUsers`. |
| `docs/Performance.md` | **New** — baseline, before/after, and "deliberately not changed" rationale. |
| [`docs/project/current-architecture.md`](../project/current-architecture.md) | Update §16/§17 for resolved/re-deferred items. |
| `docs/phases/00-index.md` | Status update on phase completion (`/finish-phase`). |

> Server-read changes (`queries.ts`) are listed as *possible* — whether they change at all is
> decided by Workstream 1's measurement.

---

## Definition of Done

- **Bundle analysis was actually run and recorded** — real route-level numbers in
  `docs/Performance.md`, not assumptions.
- **`xlsx` is confirmed out of the Students route's first-load JS**, with before/after numbers
  documented; import, export, and template-download flows all still work.
- **The two `listAllAuthUsers` deferrals are resolved or explicitly re-deferred with a stated
  bound**, and `current-architecture.md` §16 is updated accordingly.
- **`docs/Performance.md` exists** and is honest about what was *not* changed and why
  (authenticated-read caching N/A, image optimization deferred, memoization owned by React Compiler).
- **No schema / SQL / auth-model / dependency changes** beyond the `@next/bundle-analyzer`
  devDependency.
- **No regressions** in RTL/LTR, dark mode, or loading/empty/error states on touched surfaces
  (Students, Teachers, Settings), verified in `ar` + `en`.
- **Build, typecheck, and lint pass.**
- **No Phase 15 / 16 / 17 / 20 work performed.**

---

## Decision Log

> This section is **not** part of the implementation plan. It is a permanent, append-only record of
> the significant performance-related decisions made *while implementing* Phase 14 — kept here so a
> future session can understand not just *what* was done, but *why* an optimization was accepted,
> rejected, or deferred, without re-deriving the reasoning from scratch.

### Why this log exists

This phase is evidence-driven (see "Performance philosophy"), which means many decisions hinge on a
measurement and a judgement call — including the decision **not** to do something. Those judgement
calls are easy to lose. The Decision Log preserves the reasoning so the phase's intent survives long
after the numbers are forgotten, and so nobody later mistakes a deliberate non-change for an
oversight.

### What belongs here

Record any significant performance-related decision, such as:

- An optimization **rejected** after measurement (it wasn't worth the cost/complexity).
- An optimization **accepted** after measurement (with the measured win).
- An optimization **deferred**, with the justification and where it goes (e.g. Phase 20).
- An **unexpected finding** during implementation (a chunk, dependency, or read that surprised us).
- A **trade-off** that shaped the final decision (e.g. simplicity vs. a marginal gain).
- An **architecture decision made because of a measurement result**.
- Any **change to Phase 14's original assumptions** (e.g. a workstream that resolved differently than
  the plan predicted, such as Workstream 3 ending in a documented bound rather than a code change).

### Log vs. `docs/Performance.md` — division of labor

- **`docs/Performance.md` holds the evidence** — the baseline/final metrics, before/after numbers,
  bundle compositions, and chunk sizes. It is the data of record.
- **This Decision Log holds the reasoning** — the *why* behind each decision, in prose. When the
  supporting numbers live in `docs/Performance.md`, an entry here should **reference** them rather
  than duplicate them (keep one source of truth for each metric).

### Entry format

Each entry is short and dated. Suggested shape:

```text
#### <date> — <decision title>
- Decision: accepted | rejected | deferred | finding | assumption-change
- Context: what prompted it (link to the metric in docs/Performance.md if applicable)
- Reasoning: why this was the right call
- Outcome / follow-up: what changed, or where deferred work now lives
```

### Entries

#### 2026-06-30 — `@next/bundle-analyzer` is Turbopack-incompatible (assumption change)

- Decision: assumption-change / finding
- Context: The plan assumed `ANALYZE=true next build` would emit the treemap. Next 16 builds with
  **Turbopack by default**, and `@next/bundle-analyzer` is **webpack-only** — it prints a notice and
  generates no report under Turbopack. Next 16 also no longer prints per-route "First Load JS"
  columns in the build route table.
- Reasoning: The analyzer's own message documents the workaround (`--webpack`). But the app *ships*
  Turbopack, so the webpack build is only a composition aid, not the source of truth for sizes. The
  faithful baseline must come from the **Turbopack** artifact.
- Outcome / follow-up: Adopted a two-track measurement method, recorded in `docs/Performance.md`
  → "Reproduction": (1) absolute sizes + first-load membership from the Turbopack build by mapping
  routes → chunks via each route's `page_client-reference-manifest.js` and measuring chunk files on
  disk; (2) the webpack analyzer treemap (`ANALYZE=true next build --webpack`) kept only as a
  module-composition aid. The analyzer stays installed (it still produces a useful treemap) and
  `ANALYZE`-gated; it is simply not relied on for shipped sizes. No scope change.

#### 2026-06-30 — Baseline captured; `xlsx` confirmed as the first-load target on `/students`

- Decision: finding (baseline established)
- Context: Measured the shipped Turbopack build. `xlsx` is chunk `3wqfery54wtvh.js` at
  **476 KB raw / 160 KB gzip** — the single largest client chunk (~67% larger than the next) — and is
  referenced by **exactly one** route manifest: `/students` (numbers in `docs/Performance.md`).
- Reasoning: This confirms the plan's premise empirically: `xlsx` is in the `/students` first-load
  client JS today, via static imports in `parse.ts`/`export.ts`/`template.ts`. It is the highest-value
  bundle target and is isolated to one route, so the change is low-blast-radius.
- Outcome / follow-up: Workstream 2's success criterion is now concrete and verifiable — after the
  change, `xlsx` must no longer be a static reference in `students/page_client-reference-manifest.js`
  and must appear as an on-demand async chunk. Proceed to Workstream 2 on approval.

#### 2026-06-30 — Workstream 2: lazy-loaded `xlsx`; removed from `/students` first load

- Decision: accepted (after measurement)
- Context: `xlsx` was the only dependency large enough to justify code-splitting (baseline:
  476 KB raw / 160 KB gz, ~67% larger than the next chunk). Converted the three static
  `import * as XLSX from "xlsx"` sites to `await import("xlsx")` inside their handlers
  (`parse.ts`, `export.ts`, `template.ts`).
- Reasoning: A dynamic `import()` is the minimal, idiomatic way to drop a dependency out of the
  static graph. The functions that touch `xlsx` necessarily became `async` (return `void → Promise<void>`),
  but the **locked names are unchanged** and the callers are fire-and-forget event handlers
  (`ExportMenu`) or already-awaited (`ImportDialog`), so the **user experience is identical**.
  `WorkSheet` is referenced only as a type, so it stays a type-only import (erased — no bundle cost).
- Trade-off considered: making the export helpers `async` vs. leaving them sync and accepting `xlsx`
  in first load. The async change is invisible at the call sites (downloads/parse already happen
  asynchronously from a user's perspective) and costs nothing in UX, so removing ~160 KB gz from the
  Students first paint clearly wins.
- Outcome: **Verified against the approved Turbopack methodology** — route manifests referencing the
  `xlsx` chunk went **1 → 0**; `xlsx` is now an on-demand async chunk, absent from every route's
  first-load set. Build ✓ (TypeScript ✓), lint ✓ (no new warnings). Numbers in `docs/Performance.md`
  → "Before / after comparison". **No additional code splitting was performed** — nothing else in the
  baseline warranted it, and the plan forbids speculative splitting.

#### 2026-06-30 — Workstream 3: deduped `/teachers` auth-user scan (2 → 1); `/students` re-deferred

- Decision: accepted (`/teachers`) + finding/re-defer (`/students`)
- Context: Code-path analysis of the deferred `listAllAuthUsers` work showed the redundancy lives on
  **`/teachers`**, not `/students`. `/teachers` renders `Promise.all([getTeachers(), getPromotableUsers()])`
  and each ran its own full `auth.users` scan with a freshly-created admin client → **2 scans per
  render**. `/students` calls the scan only **once** (`getStudentAccountStatusMap`) → no redundancy.
- Reasoning: Introduced `getAllAuthUsers = cache(() => listAllAuthUsers(supabaseAdminClient()))`
  (React `cache()`, request-scoped) and pointed both teacher queries at it. The accessor takes **zero
  args** so the cache key is stable — keying on an injected client would never dedupe because each
  caller builds its own. `cache()` is **per-request only** (no cross-user exposure) and is explicitly
  **not** `use cache`/`cacheLife` (forbidden for user-scoped reads). Callers keep `requireRole`, and
  the three query names/signatures are unchanged, so permissions, behavior, and output are identical.
- Trade-off considered: a cross-request TTL cache (would also help `/students`) vs. request-scoped
  `cache()`. The TTL cache adds invalidation + staleness risk for **no measured benefit** at school
  scale, so it was declined — request-scoped dedupe is the smallest safe change that fixes the actual
  redundancy.
- Outcome:
  - **`/teachers`: resolved** — `auth.users` full scans per render **2 → 1** (deterministic from the
    shared zero-arg `cache()`); one admin client created instead of two for listing. Build ✓
    (TypeScript ✓), lint ✓ (no new warnings).
  - **`/students`: intentionally re-deferred** — it already does a single, necessary scan; the scan
    can't be removed without storing sign-in state in `public` (a schema change, forbidden), and it's
    already bounded (`perPage: 200`, ≤ 50 pages). Honest "no optimization justified" outcome, bound
    documented. Larger-scale caching → Phase 20.
  - Evidence + method note (why this is code-path analysis, not a byte count) in `docs/Performance.md`
    → "Server read efficiency (Workstream 3)".
  - New helper `getAllAuthUsers` added to `naming-conventions.md`.

#### 2026-06-30 — Workstream 4: documentation finalized; Phase 14 closed

- Decision: finalization (no code change)
- Context: Documentation pass to make `docs/Performance.md` the complete, internally consistent
  historical record and to sync architecture docs to the as-built state.
- Actions: completed the "Optimizations intentionally not implemented" section (authenticated-read
  caching N/A, `next/image` deferred, manual memoization owned by React Compiler, speculative
  splitting declined); cleared stale "pending" notes; updated `current-architecture.md` §16 (the two
  Phase 14 deferrals → one **resolved** (`/teachers` 2→1), one **intentionally re-deferred**
  (`/students` single necessary scan)) and the header sync note (**Last synchronized: after Phase
  14**; **Next phase: 15**); added `docs/Performance.md` to the companion-docs list.
- Reasoning: A performance phase's value is only durable if the *why* (including the deliberate
  non-changes) is recorded; this closes the loop the philosophy section set up — "measured and
  intentionally left unchanged" is captured explicitly, not silently dropped.
- Outcome: Phase 14 Definition of Done verified item-by-item (see the plan's DoD); build ✓
  (TypeScript ✓), lint ✓ (0 errors). No further optimization performed. Phase 14 complete and ready
  to commit.
