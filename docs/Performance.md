# Bayan — Performance Record (Phase 14)

> The **evidence** record for Phase 14. This file holds measurements (numbers, chunk sizes,
> before/after deltas). The **reasoning** behind each decision lives in the Decision Log of
> [`docs/phases/14-performance.md`](phases/14-performance.md). Each fact has one home: numbers here,
> rationale there.
>
> **Status:** Phase 14 complete — all four workstreams (Measurement Baseline, Bundle Optimization,
> Server Read Efficiency, Documentation) done and verified. This file is the permanent historical
> record for the phase.

---

## Reproduction

How to regenerate every number in this document.

| Goal | Command | Read from |
| --- | --- | --- |
| Shipped production build (Turbopack — what actually ships) + build health | `npx next build` | Build log; `.next/static/chunks/`; `.next/server/app/**/page_client-reference-manifest.js` |
| Bundle treemap report (webpack analyzer) | `ANALYZE=true npx next build --webpack` | `.next/analyze/client.html` (+ `nodejs.html`, `edge.html`) |
| Lint health | `npx eslint .` | console |

**Tooling note (important — see Decision Log 2026-06-30 entries).** `@next/bundle-analyzer` is
webpack-based and is **not compatible with Turbopack builds** (Next 16 builds with Turbopack by
default). Plain `ANALYZE=true next build` prints a notice and produces no report. The treemap
therefore requires the `--webpack` flag, which builds a *webpack* variant purely for analysis.
Because the shipped build is Turbopack, **absolute chunk sizes and first-load membership in this
record are taken from the Turbopack build** (the real artifact); the webpack analyzer treemap
(`.next/analyze/client.html`) is kept only as a module-composition aid.

Additionally, Next 16's build route table **no longer prints per-route "First Load JS / Size"
columns**. Per-route weight is therefore established by mapping routes → chunks via each route's
`page_client-reference-manifest.js` and measuring the chunk files on disk, rather than reading a
route-table column. This is the reproducible substitute for the old "First Load JS" metric.

Measured on: **2026-06-30**, Next.js **16.2.9**, Node **24.17.0**, npm **11.17.0**.

---

## Measurement methodology revision (supersedes the original plan assumption)

> **This is a documentation/methodology update only — it does not change Phase 14's implementation
> scope, workstreams, constraints, or Definition of Done.** It records *how* we measure, and why that
> changed, so future contributors trust the numbers below. The reasoning is also logged in
> [`docs/phases/14-performance.md`](phases/14-performance.md) → Decision Log (2026-06-30).

**Original planning assumption.** The Phase 14 plan assumed the baseline would come from running the
Webpack Bundle Analyzer via `ANALYZE=true next build`, reading per-route "First Load JS" from the
build route table and chunk weights from the analyzer treemap.

**Why that approach is no longer sufficient under Next.js 16 + Turbopack.**

1. **Next 16 builds with Turbopack by default**, so `next build` produces a **Turbopack** artifact —
   that is what actually ships to users.
2. **`@next/bundle-analyzer` is webpack-only.** Under a Turbopack build it prints a compatibility
   notice and generates **no report**. Forcing it with `--webpack` builds a *different* (webpack)
   artifact that is **not what ships**, so its absolute sizes are not authoritative.
3. **Next 16's build route table no longer prints per-route "First Load JS / Size" columns**, so the
   metric the plan intended to read no longer exists in that form.

Measuring the webpack artifact for shipped-size claims would therefore be measuring the wrong build.

**Authoritative method now: Turbopack artifact analysis.** For all shipped-size and first-load
claims, Phase 14 measures the **Turbopack production build** directly:

- **Chunk sizes** — measured from the real files in `.next/static/chunks/` (raw and gzip).
- **Route → chunk membership (the "First Load JS" substitute)** — derived by mapping each route to its
  chunks via that route's `.next/server/app/**/page_client-reference-manifest.js`, instead of a
  route-table column.
- **Dependency identification** — chunks are attributed to a dependency by content markers
  (e.g. SheetJS markers for `xlsx`).

The **webpack analyzer is retained only as a secondary, module-composition aid** (the
`.next/analyze/*.html` treemaps), behind the `ANALYZE` gate. It is never the source of truth for
shipped sizes.

**Status of this method.** This revised methodology **supersedes the original planning assumption**
and is the **official baseline method for all Phase 14 measurements** — baseline, final, and any
re-measurement. The before/after comparison later in this document uses this method on both sides so
the deltas are apples-to-apples.

---

## Baseline measurements (before any optimization)

### Build health

| Check | Result |
| --- | --- |
| `next build` (Turbopack) | ✓ success, exit 0; compiled ~21s; TypeScript ✓; 32 static pages generated |
| `eslint .` | ✓ exit 0; 0 errors, 4 pre-existing warnings (React Compiler skips memoizing TanStack Table's `useReactTable` — benign, not introduced by Phase 14) |
| `ANALYZE=true next build` (no flag) | No analyzer report (gate inert) — confirms zero impact on normal/production builds |
| `ANALYZE=true next build --webpack` | ✓ analyzer reports written to `.next/analyze/` |

### Largest client chunks (Turbopack build — what ships)

Top chunks by raw size, with gzip:

| Chunk | Raw | Gzip | Notes |
| --- | --- | --- | --- |
| `3wqfery54wtvh.js` | **486,920 B (~476 KB)** | **164,034 B (~160 KB)** | **SheetJS / `xlsx`** — confirmed by `SheetJS`/`sheetjsghost` markers. Single largest client chunk. |
| `0e0f85v6-kaq6.js` | 292,647 B | 64,719 B | (shared) |
| `12phktjw_qzac.js` | 292,647 B | 64,720 B | (shared) |
| `3qb7pudmvptno.js` | 292,647 B | 64,738 B | (shared) |
| `2nykiepra7i1k.js` | 227,537 B | 70,924 B | (shared) |
| `0-io13xfj75wi.js` | 191,044 B | 48,098 B | framework |
| `0cz1d0mv5g_q7.js` | 112,594 B | 39,496 B | polyfills |

The `xlsx` chunk is **~67% larger (raw)** than the next-largest chunk and the **heaviest single
dependency in the app**.

### `xlsx` placement (the Workstream 2 target)

| Question | Baseline answer | Method |
| --- | --- | --- |
| Which chunk is `xlsx`? | `3wqfery54wtvh.js` (476 KB raw / 160 KB gz) | `grep` for `SheetJS`/`sheetjsghost` markers across `.next/static/chunks/` |
| Which routes load it on first paint? | **Exactly one: `/[locale]/(app)/students`** | Only `students/page_client-reference-manifest.js` references the chunk (`grep -rl` over `.next/server/app` → 1 match) |
| Why is it first-load today? | Static `import * as XLSX from "xlsx"` in `parse.ts` / `export.ts` / `template.ts`, statically imported by the `"use client"` `ImportDialog` / `ExportMenu`, which render on the Students page | Static import graph |

**Target for Workstream 2:** after converting to `await import("xlsx")` inside the handlers, the
`xlsx` chunk should **no longer be a static reference** in `students/page_client-reference-manifest.js`
and should become an **on-demand async chunk** fetched only when a user imports/exports.

---

## Final measurements (after Workstream 2 — bundle)

> Bundle results below; server-read results are in "Server read efficiency (Workstream 3)" further
> down.

Measured on the same Turbopack build, same method as the baseline.

### `xlsx` placement (after lazy-load)

| Question | Baseline | After Workstream 2 | Method |
| --- | --- | --- | --- |
| Route manifests statically referencing the `xlsx` chunk | **1** (`/students`) | **0** | `grep -l` the chunk basename across `.next/server/app/**/page_client-reference-manifest.js` |
| Is `xlsx` in any route's first-load JS? | Yes (`/students`) | **No** | derived from the above |
| Does the `xlsx` chunk still exist (loadable on demand)? | n/a (was first-load) | **Yes** — async chunk | chunk present in `.next/static/chunks/`, no longer in any page manifest |
| `xlsx` chunk size | 486,920 B raw / 164,034 B gz | 434,192 B raw / 145,493 B gz | `stat` + `gzip -c \| wc -c` |

> Chunk basenames are content-hashed and change every build (baseline `3wqfery54wtvh.js` →
> after `2d04ckd0p13-t.js`); identity is established by SheetJS content markers, not the name.

### Build health (after)

| Check | Result |
| --- | --- |
| `next build` (Turbopack) | ✓ exit 0; TypeScript ✓; 32 static pages generated |
| `eslint .` | ✓ exit 0; 0 errors, same 4 pre-existing warnings (no new warnings from the async change) |

## Before / after comparison

| Metric | Before | After | Delta |
| --- | --- | --- | --- |
| `/students` first-load includes `xlsx` | **Yes** | **No** | **`xlsx` removed from the Students initial bundle** |
| Route manifests referencing `xlsx` chunk | 1 | 0 | −1 |
| `xlsx` weight removed from `/students` first load | — | — | **~476 KB raw / ~160 KB gzip** (the baseline chunk weight, no longer first-load) |
| `xlsx` availability | eager (first paint) | on demand (import/export action) | behavior preserved, deferred fetch |
| Build / lint | ✓ / ✓ | ✓ / ✓ | no regression |

The Students route no longer pays for SheetJS on first paint; it is fetched only when a user actually
imports or exports. This is the single largest client dependency in the app (≈67% larger than the
next chunk at baseline), so removing it from first load is the highest-value bundle change available —
and the measurement confirms it landed.

## Performance impact (what it means for users)

A plain-language read of the numbers above — why this change matters in practice.

- **What changed:** the `xlsx` spreadsheet library is no longer part of the Students page's initial
  download. It now loads **only when Import or Export is actually used.**
- **Why users benefit:** opening the Students page is **lighter and faster to become interactive** —
  visitors who never import or export (the common case) never download ~160 KB (gzip) of code they
  don't need.
- **Behavioral changes:** none visible. Import, export, and template downloads work exactly as before.
- **API changes:** none for users; internally the helpers became `async`, but all function **names,
  inputs, and workflows are unchanged**.
- **Trade-off:** the **first** time someone clicks Import or Export in a session, there's a small
  one-time delay while `xlsx` loads on demand. It is cached afterward, so subsequent uses are
  instant.
- **Is the trade-off acceptable?** Yes. Import/export is an occasional, deliberate action where a
  brief load is unsurprising, whereas page load happens constantly — so shifting the cost off the
  hot path and onto the rare action is the right balance.

## Implemented optimizations

**Lazy-load SheetJS (`xlsx`).** Converted the three static `import * as XLSX from "xlsx"` sites to
on-demand `await import("xlsx")` inside their handlers:

- [`features/students/import-export/parse.ts`](../features/students/import-export/parse.ts) —
  `parseStudentImportFile` (already `async`); import moved into the function body.
- [`features/students/import-export/export.ts`](../features/students/import-export/export.ts) —
  `buildSheet` / `downloadSheet` / `exportStudents` became `async` and load `xlsx` on demand;
  `WorkSheet` kept as a **type-only** import (erased, zero bundle cost).
- [`features/students/import-export/template.ts`](../features/students/import-export/template.ts) —
  `downloadStudentTemplate` became `async` and loads `xlsx` on demand.

Locked names (`parseStudentImportFile`, `exportStudents`, `downloadStudentTemplate`, `downloadSheet`)
are unchanged; only return types went `void → Promise<void>`. Callers are fire-and-forget event
handlers (`ExportMenu`) or already-awaited (`ImportDialog`), so the user experience is identical.

**No additional code splitting was performed.** Per the plan, splitting beyond `xlsx` requires
measurement justification; nothing else in the baseline approached `xlsx`'s weight, and the
remaining large chunks are framework/shared code needed for first interaction (see "Optimizations
intentionally not implemented").

---

## Server read efficiency (Workstream 3)

### Method note

This optimization is a **runtime call-count** reduction, not a bundle artifact, so the evidence is
**code-path analysis** grounded in React `cache()`'s documented request-scoped memoization — the
server-read analog of the Turbopack methodology used for bundles. (A bare-Node micro-test is *not* a
faithful measure: React `cache()` only memoizes while a server render's cache dispatcher is active,
which is automatic in RSC but absent in a standalone script; React **19.2.4** here.)

### Baseline — `listAllAuthUsers` invocations per render

`listAllAuthUsers` walks the GoTrue admin user list in pages (`perPage: 200`, up to 50 pages) — one
full `auth.users` scan per call. Per-render call counts at baseline:

| Route | Callers in one render | `auth.users` full scans | Redundant? |
| --- | --- | --- | --- |
| `/teachers` | `getTeachers()` **and** `getPromotableUsers()` (via `Promise.all`), each calling `listAllAuthUsers` with its own fresh admin client | **2** | **Yes — 2 independent scans for the same data** |
| `/students` | `getStudentAccountStatusMap()` only (the other reads are plain `profiles` queries) | **1** | No — single necessary scan |

### Change — request-scoped dedupe via React `cache()`

Added `getAllAuthUsers = cache(async () => listAllAuthUsers(supabaseAdminClient()))`
([`features/students/identity/queries.ts`](../features/students/identity/queries.ts)) and pointed
both teacher queries at it ([`features/teachers/queries.ts`](../features/teachers/queries.ts)). The
accessor takes **zero args** so the cache key is stable (keying on an injected client would never
dedupe — each caller builds a fresh one).

| Route | Before | After | Delta |
| --- | --- | --- | --- |
| `/teachers` `auth.users` full scans per render | **2** | **1** | **−1 (−50%)** |
| `/students` `auth.users` full scans per render | 1 | 1 | unchanged (no redundancy to remove) |
| Admin clients created for user listing on `/teachers` | 2 | 1 | −1 |

Within a single `/teachers` render, `getTeachers` and `getPromotableUsers` now share one memoized
listing instead of each performing its own — a deterministic property of `cache()` keyed on identical
(empty) arguments.

### Why this is safe (architecturally)

- React `cache()` is **per-request only** — never shared across requests or users — so there is no
  cross-user data exposure. This is the approved approach in the plan, and is deliberately **not**
  `use cache` / `cacheLife`, which are unsafe for user-scoped reads.
- **Permissions unchanged:** every caller still runs `requireRole(...)` before invoking the accessor;
  the helper only lists, exactly as `listAllAuthUsers` did.
- **Behavior/API unchanged:** `getTeachers` / `getPromotableUsers` / `getStudentAccountStatusMap` keep
  their names, signatures, and `profile_id`-based resolution. Same data, same output.

### Build health (after Workstream 3)

| Check | Result |
| --- | --- |
| `next build` (Turbopack) | ✓ exit 0; TypeScript ✓ |
| `eslint .` | ✓ exit 0; 0 errors, same 4 pre-existing warnings (none new) |

### Server read impact (what it means in practice)

| Scenario | Before | After |
| --- | --- | --- |
| Teachers page render | 2 `auth.users` scans | 1 `auth.users` scan |
| Students page render | 1 `auth.users` scan | 1 `auth.users` scan |
| User-visible behavior | No change | No change |

The optimization **removes redundant server work** — the Teachers page no longer scans the auth user
list twice for the same render — **without** introducing persistent caching (the dedupe is
request-scoped only, never shared across requests or users), **without** changing authentication
behavior, **without** modifying permissions (every caller still gates with `requireRole`), and
**without** affecting the user experience. It is a pure backend efficiency gain: same data, same
output, fewer calls.

---

## Optimizations intentionally not implemented

**`/students` per-load `auth.users` scan — left as one necessary scan (Workstream 3).** Unlike
`/teachers`, the `/students` render calls `listAllAuthUsers` only **once** (in
`getStudentAccountStatusMap`), so there is **no in-request redundancy to dedupe**. The scan itself is
*inherent*: account status (`invited` vs `active`) is derived from `auth.users.last_sign_in_at`, which
lives in the auth schema. Eliminating the scan would require storing sign-in state in `public` — a
**schema change**, which is out of scope and forbidden. A cross-request TTL cache of the listing was
considered and **declined**: it adds invalidation complexity and staleness risk for no measured
benefit at school/demo scale (the scan is already bounded — `perPage: 200`, ≤ 50 pages). Honest
outcome: **resolved as "no optimization justified," bound documented, re-deferred** (see "Deferred
opportunities").

The following were each considered and **deliberately not done** — recording them is itself a Phase 14
deliverable, so a future reader knows they were evaluated, not overlooked.

- **`use cache` / `cacheLife` / `cacheTag` on authenticated reads — not applied (architecturally
  unsafe).** Nearly every read is cookie-bound and user-scoped (`supabaseServerClient()` +
  `auth.getUser()`). Next's persistent caching primitives are unsafe for per-user authenticated data
  (cross-user leakage risk) and are explicitly forbidden by the plan. The only server-read change made
  (Workstream 3) uses React `cache()`, which is **request-scoped**, not persistent — a deliberately
  different mechanism. No genuinely non-user-specific, cacheable read surfaced that would benefit.
- **`next/image` for avatars — deferred.** The only images are avatars: WebP, ≤ 1 MB,
  dimension-capped, rendered via plain `<img>`. There are no content/hero images. Migrating two tiny
  avatars to `next/image` (plus Supabase remote-pattern config) is marginal; the baseline surfaced no
  image weight to justify it. Revisit only if real image surfaces appear.
- **Manual memoization (`useMemo` / `useCallback` / `memo`) — not added.** The **React Compiler is
  enabled** (`reactCompiler: true`), so it handles memoization; hand-memoization is redundant and
  discouraged by project rules.
- **Speculative code-splitting (TanStack Table, the SVG charts, other dialogs) — not done.** The
  baseline showed nothing else approaching `xlsx`'s weight. The table is needed for first interaction
  on management pages (a poor split candidate), and the charts are a dependency-free SVG kit (nothing
  to split). Splitting them would add complexity for no measured gain — and the plan forbids
  speculative optimization.
- **`/students` per-load `auth.users` scan — kept as one necessary scan** (detailed above): no
  in-request redundancy, and removing the scan would require a forbidden schema change.

## Technical rationale

See the Decision Log in [`docs/phases/14-performance.md`](phases/14-performance.md). Numbers here;
reasoning there.

## Deferred opportunities (future phases)

- **`/students` and `/teachers` per-load `auth.users` scan at larger scale.** After Workstream 3 each
  of those renders performs **one** bounded full scan (down from two on `/teachers`). That is fine at
  school/demo scale but is still `O(users / 200)` admin calls per load. If the user base grows into
  the high thousands, revisit with a short-TTL cross-request cache of the listing or pagination of the
  surfaces — **Phase 20 (scaling strategy)**. Not justified now (no measured pain; the bound is
  small).
- *Other deferred items (large-scale scalability, DB/query redesign, list virtualization, broader
  caching) are enumerated in "Future performance work" in the Phase 14 plan — most to Phase 20.*
