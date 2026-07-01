# Phase 16 — Testing

> **Status: Complete — Vitest suite implemented (see `docs/Testing.md`).** This spec was **rewritten against the current
> architecture** (post Phases 1→15, including the Phase 12.5 identity redesign, the Phase 12.6
> role/profile work, Phase 13 Reading Analytics, Phase 14 Performance, and the Phase 15
> Accessibility Audit). It **supersedes the original five-bullet draft**, which was authored before
> any code existed, named generic targets ("integration tests", "auth"), and predated every pure
> domain module that is now the suite's backbone. For how the system works today, the single source
> of truth is [`docs/project/current-architecture.md`](../project/current-architecture.md).
>
> **Companion doc (evidence):** [`docs/Testing.md`](../Testing.md) is created in this phase and is
> the **living record** — how to run the suite, what is covered (and the invariant each test
> protects), the conventions every future phase must follow, and what is deliberately *not* covered
> and why. This file holds the **plan and decision log**; `Testing.md` holds the **coverage map and
> conventions**. Same one-home-per-fact split as `docs/Performance.md` (Phase 14) and
> `Accessibility.md` (Phase 15).

---

## Guiding principle

Test the things that **protect the architecture's invariants and the product's core math** — not
coverage for its own sake. Bayan is server-first by construction: the valuable logic is **pure and
already extracted** (fluency formulas, analytics windowing/aggregation, role predicates, the import
classifier, Zod schemas, locale catalogs), and several real **composition seams between those pure
modules are themselves offline and deterministic**. That logic — both the units and the seams where
they meet — is the highest-leverage, lowest-cost thing to test, and needs **zero infrastructure**. We
test it first and most thoroughly.

"Integration testing" here means **offline integration**: multiple server-safe pure modules working
together over fixture inputs (request-param → validation → domain logic; schema → transform →
business logic; windowing → bucketing → trend). It does **not** mean a fake-Supabase harness driving
the server-action sagas. Those sagas re-validate every input with the **same Zod schema the client
used** (so the schema test covers the input contract) and resolve identity through thin `profile_id`
queries; their *wire* behavior — cookies, GoTrue, RLS, `revalidatePath` — only emerges against a live
Auth server + database, which is **end-to-end territory, deferred to Phase 19** where a test
environment exists. The line is: **compose the pure modules (in scope); touch a real service (Phase
19).**

---

## Scope guardrails

- **Dev tooling only — no product-stack substitution.** The test runner and helpers are added to
  **`devDependencies`** only (Vitest, Testing Library, jsdom, `vitest-axe`). This is the **same
  precedent Phase 14 set** with `@next/bundle-analyzer`: the locked tech stack governs the *product*;
  a test runner is development tooling, not a stack change. No runtime dependency is added.
- **No production code changes to make code "testable."** The pure modules are already pure and
  injectable (every analytics fn takes `now` explicitly; the schema factories take injected
  messages; the classifier takes its roster + messages as args). If a genuine test seam is missing,
  prefer testing the unit as-is; a tiny, behavior-preserving pure-logic extraction is allowed
  **only** when there is no other way and it changes no public name or signature (locked by
  `naming-conventions.md`).
- **No schema / SQL / auth-model / RLS changes.** Frozen, as in every phase since 12.5.
- **No coverage-percentage gate as a goal.** Coverage may be *reported*; it is not a target to chase.
  A meaningful test of the WPM formula's edge cases beats 100% line coverage of a barrel file.
- **No new abstractions in product code.** A single shared `renderWithIntl` test helper and the
  fixture builders live under the test scaffolding, not in `features/` or `lib/`.

---

## Phase boundaries (what Phase 16 is NOT)

- **Offline integration IS in scope; infrastructure-dependent integration is NOT.** Composing pure,
  server-safe modules over fixtures is core Phase 16 work (see the *Offline Integration Tests*
  category). What is deferred is any test that reaches a **real service**: Supabase (session or admin
  client), GoTrue/Auth, cookies, `revalidatePath`, or `requireRole` resolution.
- **End-to-end / live-database tests → Phase 19 (Deployment).** Browser-driven flows (login, the
  registration saga, the `student_number` claim, admin activation links, completing a real reading
  session, a role change) require a seeded Supabase test database and an environment that does not
  exist yet. Standing that up belongs with Deployment/CI. Phase 16 is **deterministic and offline**:
  no network, no Supabase, no cookies.
- **Server-action *wire* behavior & RLS verification → Phase 17 + Phase 19.** Whether a policy
  actually blocks a cross-user write is a *database* property (Phase 17 tightens RLS; Phase 19
  exercises it live). Phase 16 tests the **pure input contract** (the shared Zod schema), the **pure
  authorization predicates** (`roles.ts`), and the **offline computation** an action performs
  (recompute, classify) — not the cookie/GoTrue/insert path.
- **The Playwright keyboard/screen-reader runs Phase 15 handed forward are E2E → Phase 19.** Phase 15
  explicitly deferred "jest-axe / Playwright keyboard runs" here. Phase 16 honors the **`jest-axe`
  half** (automated a11y smoke on rendered client components, via `vitest-axe`); the **Playwright
  keyboard half** is browser E2E and moves with the rest of E2E to Phase 19. `Testing.md` records
  this split so the Phase 15 handoff is not lost.
- **No re-testing of third-party libraries** (Radix, TanStack Table, Zod's own engine, next-intl's
  formatter) and **no memoization tests** (the React Compiler owns that — `CLAUDE.md`).
- **No phase-15/17/18/20 work.** Hold the boundaries.

---

## Method — four test categories

The suite is organized into **four explicit categories**, highest-leverage first. Unit, Offline
Integration, and Localization run in a fast **Node** environment (no DOM); Component/RTL runs in
**jsdom**. Tests are **colocated** with the unit under test (`fluency.ts` → `fluency.test.ts`;
pipeline tests next to their lead module), matching the feature-based structure — never a parallel
`__tests__/` tree.

### 1. Unit Tests (pure single-module logic + schema contracts)

Each module tested in isolation — the core of the suite, zero mocking.

| Module | What the tests assert |
| --- | --- |
| [`features/reading/sessions/fluency.ts`](../../features/reading/sessions/fluency.ts) | `countWords` on Arabic + mixed-script + whitespace-collapsed text; `computeFluency` rounding, the **degenerate-input guards** (zero duration → 0 not `Infinity`; zero words → 0 not `NaN`) and the `errors` clamp to `[0, wordCount]`. **The product's core metric** — the DoD calls it out by name. |
| [`features/analytics/time-range.ts`](../../features/analytics/time-range.ts) | `resolveAnalyticsWindow` / `resolveComparisonWindow` / `resolveBucketGranularity` / `isTimeRange` for every range incl. `all` (null start, null comparison). Determinism provable because `now` is an explicit arg. |
| [`features/analytics/aggregate.ts`](../../features/analytics/aggregate.ts) | The **edge cases the analytics integration test can't localize**: `computeTrendIndicator` (`comparable=false`/null-previous → null delta not `0`; neutral deadband at `TREND_NEUTRAL_THRESHOLD`), `bucketAverages` (empty bucket → `null`) vs `bucketCounts` (empty bucket → `0`), `MAX_BUCKETS` cap. |
| [`features/analytics/search-params.ts`](../../features/analytics/search-params.ts) | `parseAnalyticsSearchParams` — defaults applied, invalid range → `DEFAULT_TIME_RANGE`, blank/array student coerced (the URL-contract guard). |
| [`features/analytics/reading/insights.ts`](../../features/analytics/reading/insights.ts) | `deriveReadingInsights` — each insight kind fires on the right condition and stays silent otherwise; `needs_more_data` below the session floor; `steady_progress` fallback; each kind at most once (the `id = kind` stable-key invariant). |
| [`features/auth/roles.ts`](../../features/auth/roles.ts) | **One table-driven test** of the capability matrix (each capability × each role → expected boolean — the executable form of the `architecture.md` permission table, so an accidental widening is caught), **not** one trivial test per predicate. Plus thorough **`canChangeRole`**: rejects non-admin, rejects self, rejects to/from `admin`, rejects no-op, accepts only `student⇄teacher` (the Phase 12.6 security invariant). |
| [`features/students/identity/student-number.ts`](../../features/students/identity/student-number.ts) | `generateStudentNumber` **format + charset only** (`/^BYN-[0-9A-Z]{8}$/`, symbols from the base36 alphabet, successive calls differ). **Not** distribution/entropy (statistical, flaky) and **not** `generateUniqueStudentNumber` (would mock the PostgREST builder chain — brittle, couples to implementation, an external-service mock → its retry behavior is Phase 19). |
| [`features/dashboard/data/shared.ts`](../../features/dashboard/data/shared.ts) | **`startOfWeek` only** — the non-obvious **Saturday-start** rule for Arabic locales (boundary cases: a Saturday, mid-week, a Sunday), with `now` passed explicitly. `average`/`toNum`/`isNumber` are **not** unit-tested standalone — they're exercised by the analytics integration pipeline (no duplicate). |
| [`lib/collation.ts`](../../lib/collation.ts) | **Arabic search/sort invariant (currently untested, flagged by `arabic-rtl-i18n.md`).** `normalizeForSearch`: strips tashkīl + tatweel, unifies alef forms → `ا`, alef-maqsura → `ي`, taa-marbuta → `ه`, lowercases Latin — so a forgiving Arabic search keeps matching; `makeNameCollator` orders Arabic + English correctly (diacritic-insensitive, numeric-aware). |
| Bilingual display accessors ([`students/types.ts`](../../features/students/types.ts), [`reading/types.ts`](../../features/reading/types.ts)) | **Locale→AR/EN selection with AR fallback (currently untested, user-visible everywhere).** `studentDisplayName` / `passageTitle` (and `vocabularyWord` / `vocabularyMeaning`, same shape): `en` locale with both EN fields → EN; `en` locale missing an EN field → AR fallback; `ar` locale → AR. |
| [`lib/avatar.ts`](../../lib/avatar.ts) | **`avatarObjectPath`** (the object-path-not-URL invariant — exercises `avatarStorageKey` transitively) and **`validateWebpUpload`** (type-must-be-webp + size-cap server guard). The trivial wrappers (`avatarStorageKey`/`isAcceptedAvatarType`) and `avatarPublicUrl` (drags in `SUPABASE_URL` env for a string-concat cache-buster) are **not** worth standalone tests. |
| **Zod schema contracts** | Every `build*Schema` factory (`auth`, `reading/sessions`, `students`, `teachers` `buildChangeRoleSchema`, `identity` `buildClaimStudentSchema`, `settings`, `profile` + `PROFILE_NAME_MAX`): valid acceptance, invalid rejection, boundary values, and the **correct localized message key** (inject a known message map and assert the key returned). Because the server actions re-run these exact schemas, this doubles as the action **input-contract** test. This tier **owns** field-rule + message-key assertions; the two schemas reused inside integration tests (create-student, complete-reading-session) are not re-asserted there. |

### 2. Offline Integration Tests (multiple server-safe modules composed — no DB)

Real composition seams already in the codebase, exercised end-to-end **in their offline portion**
over fixtures. No Supabase, no network, no cookies — only the pure exported functions the server
layer itself calls.

| Seam | Pipeline under test | Modules crossed | Asserts |
| --- | --- | --- | --- |
| **Analytics transform** | `parseAnalyticsSearchParams(params)` → `resolveAnalyticsWindow`/`resolveBucketGranularity`(range, fixed `now`) → `bucketAverages`/`bucketCounts`(fixture session rows) → `toTrendSeries`/`summarizeTrend` → `computeTrendIndicator(average(cur), average(prev))` | `analytics/search-params` + `analytics/time-range` + `analytics/aggregate` + `dashboard/data/shared` | Bucket count per granularity; gap semantics (avg empty → `null`, count empty → `0`); `all` range → no comparison (null, not a misleading delta); KPI direction/neutral-band. Mirrors what `getCohortReadingAnalytics` composes after its read. |
| **Reading-session recompute contract** | raw form values → `buildCompleteReadingSessionSchema.safeParse` → `countWords(fixture passage text)` → `computeFluency` (+ the `errors > wordCount` guard) | `reading/sessions/schemas` + `reading/sessions/fluency` | Validated input produces the authoritative stored WPM/accuracy; invalid input is rejected with the right key; the over-error guard trips. This is the **offline computation path of `completeReadingSessionAction`**, minus the DB read/duplicate-guard/insert (those are Phase 19). |
| **Import classify pipeline** | fixture raw rows + existing roster snapshots → `classifyStudentImport` | `import-export/classify` + `students/schemas` + `import-export/columns` + `import-export/types` | create / update / skip / reject buckets + counts; within-file duplicate `student_number`/`email` (both members rejected); email owned by a *different* existing student rejected; grade `"5"` vs `"05"` is not a spurious change. Optional extension: build an in-memory CSV/XLSX buffer → `parseStudentImportFile` → classify, if SheetJS runs cleanly under Vitest. |

**Explicitly NOT integration-tested here:** anything reaching `supabaseServerClient`/`supabaseAdminClient`,
cookies, GoTrue, `revalidatePath`, or `requireRole` — those are server-action wire behaviors → Phase 19.

**Division of labor (so unit and integration tests don't duplicate):** the unit tests own the
**edge cases and field rules** (fluency formula guards; each time-range window + `all`→null;
aggregate's deadband/comparable/empty-bucket semantics; schema field rules + message keys); the
integration tests own the **composition wiring** (param→window→bucket→series→KPI; validated-input→
recompute→metrics; rows+roster→classification) and *assume* the units work. Each test localizes a
different class of failure, so neither restates the other.

### Important invariants deliberately out of scope (named, not silent gaps)

- **Student account-status derivation** (`roster_only` / `invited` / `active`) is a real Phase 12.5
  invariant, but it is **not a separately-exported pure function** — it's computed inside server-only
  `getStudentAccountStatusMap` against `listAllAuthUsers` (GoTrue). Testing it would require either a
  production extraction *solely* to enable a test (forbidden by the scope guardrails) or mocking the
  Auth admin API (an external-service mock). It belongs to **Phase 19** (live test DB). Recorded here
  so its absence is a decision, not an oversight.
- **The registration / claim / activation-link / email-change sagas** are service-coupled (GoTrue +
  service-role + compensation) → **Phase 19**. Their *pure* pieces (the schemas, `roles.ts`,
  `generateStudentNumber`, the recompute) are covered above.
- **`dailyCountsTrend`** (dashboard sparkline) reads the clock internally (no injectable `now`), is
  time-relative and dashboard-only — a brittle, low-invariant target. Intentionally excluded.

### 3. Component / RTL Tests (client components only, small & representative)

Server Components are not meaningfully unit-testable in jsdom — they belong to E2E. A shared
`renderWithIntl(ui, { locale })` helper wraps the tree in the **real** `NextIntlClientProvider`
(loading the actual catalogs) + Radix `DirectionProvider`, so these tests use production copy and
direction, not fixtures.

- **RTL correctness, concretely (not "it renders"):** render a representative form (e.g.
  `login-form` / `register-form`) and a representative interactive widget (the analytics
  `StudentPicker`) under `locale="ar"` and assert **`dir="rtl"` propagation** and that **actual
  translated copy** is on screen (not the message key); repeat one case under `locale="en"` for LTR.
- **The Phase 15 a11y handoff (`jest-axe` half):** run `vitest-axe` against 2–3 rendered client
  components (a form, the dialog/overlay primitive, the `StudentPicker` with its Phase-15 `aria-live`
  result count) and assert **no violations**. The Playwright keyboard runs remain E2E → Phase 19.

Keep this category **small and representative** — it exists to lock the RTL/i18n/a11y wiring patterns,
not to re-render every screen.

### 4. Localization Tests (catalog integrity)

The highest-ROI localization test: a **catalog-parity** test over the `en` and `ar` message files
asserting **key-set equality** (no key in one and missing in the other — the most common real i18n
bug), **no empty strings**, and **matching ICU placeholders/plural arms per key**. Pure JSON
comparison — fast, deterministic, and it fails loudly the moment a future phase adds an English string
without its Arabic counterpart. Plus a light sanity test over the locale config (supported locales,
default locale).

---

## Workstreams

### Workstream 1 — Stand up the harness

- Add the **devDependencies** in the *Test stack* table below (Vitest + Testing Library + jsdom +
  `vitest-axe`). No coverage provider (`@vitest/coverage-v8`) — coverage is not gated (scope
  guardrails). No `vite-tsconfig-paths` — the `@` alias is set manually (below).
- `vitest.config.ts`:
  - `plugins: [react()]` (`@vitejs/plugin-react`) for the JSX/TSX transform. **The React Compiler is
    *not* wired into the runner** — it's a build-time optimization irrelevant to behavior, and adding
    it would be needless complexity.
  - `resolve.alias`: map **`@` → the project root** (mirrors `tsconfig` `"@/*": ["./*"]`), and map
    **`server-only` and `client-only` → a one-line empty stub** at `test/stubs/empty.ts`. The
    `server-only` default export **throws** under Vitest's Node resolution, and several in-scope
    modules import it (`analytics/aggregate.ts`, `analytics/reading/insights.ts`,
    `students/identity/student-number.ts`, `dashboard/data/shared.ts`); the stub lets them load in the
    Node environment. Required for Unit **and** Offline-Integration tests of those layers.
  - **Environment:** default `environment: "node"` (categories 1, 2, 4). Category-3 component files
    opt into jsdom with a per-file `// @vitest-environment jsdom` docblock (not the deprecated
    `environmentMatchGlobs`; a `test.projects` split is the alternative if a global jsdom config is
    later preferred).
  - `setupFiles`: a setup module that extends `expect` with `@testing-library/jest-dom` and
    `vitest-axe` matchers.
- `package.json` scripts: `"test": "vitest run"` (CI/non-watch — the DoD command), `"test:watch":
  "vitest"`.
- Add scaffolding (under `test/`, not `features/`): the `renderWithIntl(ui, { locale })` helper —
  wraps children in `NextIntlClientProvider` (importing the real `messages/ar.json` / `messages/en.json`)
  together with the Radix `DirectionProvider`, taking `dir` from `getLocaleDirection`
  (`i18n/routing.ts`) and `locale` defaulting to `DEFAULT_LOCALE` (`lib/constants.ts`); plus small
  fixture builders (a `reading_sessions` row factory, a roster-snapshot factory). Then a one-line
  smoke test to prove the harness is green before writing real tests.
- **Lint/typecheck integration:** test files use **explicit `vitest` imports** (`import { describe,
  it, expect, vi } from "vitest"`) — no global injection — so the existing flat config
  (`eslint.config.mjs`, `eslint-config-next`) needs no test-env globals; if a specific rule genuinely
  misfires on tests, add a flat-config `files: ["**/*.test.{ts,tsx}", "test/**"]` override block
  rather than inline-disabling. Test files are **typechecked** alongside the app by the existing
  `tsconfig` include (their Vitest/Testing-Library types resolve once installed) and are **not bundled**
  by `next build` (no route imports them) — so `next build` and `eslint` stay green.
- **Runtime baseline:** the `generateStudentNumber` test uses the Web Crypto global
  (`crypto.getRandomValues`), available in Node ≥ 20 (already the Next 16 baseline) and in jsdom — no
  polyfill needed.

### Workstream 2 — Unit Tests (category 1)

The pure single-module tests from the category-1 table, including the Zod schema contracts. The bulk
of the value.

### Workstream 3 — Offline Integration Tests (category 2)

The three composition-seam pipelines from the category-2 table, over fixtures, in the Node
environment.

### Workstream 4 — Localization (category 4)

The `en`/`ar` catalog-parity test + locale-config sanity.

### Workstream 5 — Component / RTL / a11y (category 3)

The small representative set, using `renderWithIntl` + `vitest-axe`, in jsdom.

### Workstream 6 — Documentation

Create [`docs/Testing.md`](../Testing.md): run instructions; the coverage map (per **category**, with
the invariant each test protects); the **conventions every future phase must follow** (every new pure
helper ships a colocated unit test; every new composition seam ships an offline integration test;
every new Zod schema ships valid/invalid/localized tests; every new locale key must keep `en`/`ar`
parity or the parity test fails; tests are colocated, never a parallel tree); and the **explicit
non-coverage** list with reasons (E2E + server-action wire + RLS integration → Phase 19/17; no
third-party-lib or memoization tests; no coverage gate). Update `current-architecture.md`
(companion-docs list + the §17 row) and `docs/phases/00-index.md` status on `/finish-phase`.

**Order:** 1 → 2 → 3 → 4 → 5 → 6. Workstream 1 must come first (nothing runs without the harness);
2–5 are independent and can land/review incrementally; docs finalize last.

---

## Technical decisions

1. **Vitest, not Jest.** Native ESM + TS-strict, fast, and friction-free with Next 16 (Turbopack) /
   React 19 / Tailwind 4 / Zod v4 — Jest needs babel/ts-jest plumbing for no benefit here. Added as
   **devDependencies only**, mirroring the Phase 14 `@next/bundle-analyzer` precedent (dev tooling is
   not a locked-stack substitution). *(Decision confirmed with the owner during planning.)*
2. **"Integration" means offline composition, not a mocked saga.** We test the pure module seams the
   server layer composes (analytics transform, recompute contract, import classify) over fixtures;
   the cookie/GoTrue/RLS/insert wire path is E2E → Phase 19. *(Owner-confirmed correction during
   planning — see Decision Log.)*
3. **E2E deferred to Phase 19.** Full-stack flows need a seeded Supabase test DB + environment that
   only exists at Deployment. *(Owner-confirmed.)*
4. **Stub `server-only`/`client-only` in the test config.** Their default export throws under Vitest;
   aliasing to an empty stub lets server-safe pure modules (analytics aggregate/types) load in the
   Node test environment. No product code changes.
5. **Colocated `*.test.ts(x)`**, feature-local, matching the existing structure.
6. **Determinism by construction.** Every time-dependent unit already takes `now` explicitly; tests
   pass fixed instants — no fake timers, no clock reads.
7. **Real catalogs in component tests.** `renderWithIntl` loads the actual `en`/`ar` messages so RTL
   and copy assertions reflect production, and a missing translation surfaces as a test failure.
8. **Two test environments without a deprecated API.** Default `node`; component files opt into jsdom
   via the `// @vitest-environment jsdom` docblock. No `next/jest` or Next-specific test plugin — Next
   documents Vitest via `@vitejs/plugin-react`, so the runner stays decoupled from the Next/Turbopack
   build.

---

## Test stack (new devDependencies)

All **devDependencies** (the Phase 14 "dev tooling ≠ stack substitution" precedent). None is a
runtime/product dependency; none participates in `next build`, `next dev`, or `next start`.

| Package | Why it is needed | Compatibility |
| --- | --- | --- |
| `vitest` | Test runner, assertions, mocking; ESM/TS-native via esbuild (no babel/ts-jest). Runs categories 1–4. | Vite-based, Node ≥ 20; never touches the Next/Turbopack build. Zod v4 / TS-strict modules import unchanged. |
| `@vitejs/plugin-react` | JSX/TSX transform for the category-3 component tests. | React 19 compatible (automatic JSX runtime). Used only by Vitest; the React Compiler is **not** wired in. |
| `jsdom` | DOM environment for component/RTL/a11y tests (Testing Library needs a DOM). | Standard Vitest environment; opt-in per file. No CSS/Tailwind pipeline needed (tests assert `dir`/text/roles, not computed styles). |
| `@testing-library/react` | Render React 19 components and query the DOM. | v16+ supports React 19 (`act` re-exported from `react`); uses existing `react`/`react-dom`. |
| `@testing-library/dom` | Required **peer dependency** of `@testing-library/react` v16 (the query engine). | Must be installed explicitly; no conflict. |
| `@testing-library/jest-dom` | Matchers for the RTL/a11y assertions (`toHaveAttribute("dir","rtl")`, `toBeInTheDocument`, …). | Registered via `expect.extend` in the setup file; Vitest-compatible. |
| `@testing-library/user-event` | Realistic interaction for the `StudentPicker` filter/announce test. | Pairs with `@testing-library/react`; no conflict. |
| `vitest-axe` | Automated a11y assertions (`toHaveNoViolations`) — the Phase 15 `jest-axe` handoff, Vitest-native. | Bundles `axe-core`; runs in jsdom. No conflict. |

**Explicitly not added:** `@vitest/coverage-v8` (no coverage gate), `vite-tsconfig-paths` (manual `@`
alias instead), any Playwright/E2E or Supabase test packages (→ Phase 19). `@types/node` already
present; the libraries above ship their own types, so no extra `@types/*` are required.

**No conflicts with the locked stack.** Vitest uses its own Vite pipeline entirely separate from
Next 16/Turbopack, so the app's build is untouched; React 19 is supported by Testing Library v16;
TypeScript-strict is enforced by `tsc` (the runner transpiles via esbuild, no type-check at runtime);
Tailwind v4 is irrelevant to the assertions; Zod v4 schemas are imported and exercised as-is. Install
current majors together so npm resolves Vitest against its compatible Vite range.

---

## Constraints

- **devDependencies only** — no runtime/product dependency, no tech-stack substitution.
- **No schema / SQL / auth-model / RLS changes.**
- **No product code changes** beyond, at most, a behavior- and name-preserving pure extraction when a
  test seam is genuinely unavoidable (prefer none).
- **No coverage-percentage gate** as a success criterion.
- **No Phase 15 / 17 / 18 / 19 / 20 work** beyond honoring the Phase 15 `jest-axe` handoff.
- **`next build` and `eslint` stay green**; test files are typechecked with the app but **not bundled**
  by `next build` (no route imports them).

---

## Risks

| Risk | Handling |
| --- | --- |
| Adding a test runner reads as breaking the "locked stack". | devDependencies only; documented as dev tooling per the Phase 14 analyzer precedent. No runtime dep, no product-code change. |
| Temptation to mock Supabase and "integration-test" the sagas. | Out of scope — Phase 19. Test the **offline** composition seams (pure modules) the sagas reuse; never a real client. |
| `server-only` import throws under Vitest. | Alias `server-only`/`client-only` to an empty stub in `vitest.config.ts` (Workstream 1). |
| Path-alias / ESM / React-Compiler config friction under Vitest. | `@vitejs/plugin-react` + alias resolution mirroring `tsconfig`; smoke test in Workstream 1 proves the harness before real tests. |
| Component tests testing trivia ("it renders") instead of real RTL/i18n. | DoD requires asserting actual `dir` + **translated copy**, not render-success; keep category 3 small and meaningful. |
| Offline integration tests drifting toward re-implementing query internals. | Test only **exported** pure functions over fixtures (private helpers in `queries.ts` stay private); the seam, not the DB read. |
| Coverage theater / brittle full-page snapshots. | No coverage gate; no whole-page snapshots; representative components only. |
| Scope bleed into E2E or RLS. | Hold the Phase 19/17 boundary; record deferrals in `Testing.md`. |

---

## Dependencies

- **Upstream:** Phases 1→15 complete. Relies on the pure modules in their current shape (fluency,
  analytics window/aggregate/search-params/insights, roles, import classifier, schemas, avatar
  helpers, dashboard shared math) and the `en`/`ar` catalogs.
- **New tooling:** Vitest + Testing Library + jsdom + `vitest-axe` (devDependencies only).
- **Downstream:** Phase 19 (Deployment) stands up E2E (Playwright + seeded test DB) and wires the
  suite into CI, picking up the deferrals this phase records; Phase 17 (Security Review) exercises RLS
  live. Both **reference** `docs/Testing.md` rather than re-deriving the coverage map.

---

## Definition of Done

- **`npm run test` runs clean** (green, non-watch).
- **Core product math is covered with edge cases** — `countWords` / `computeFluency` incl. zero
  duration, zero words, and the error clamp.
- **Authorization invariants are covered** — one table-driven capability-matrix test and every
  `canChangeRole` rule (non-admin / self / to-or-from-admin / no-op all rejected).
- **The Arabic search/sort and bilingual-display invariants are covered** — `normalizeForSearch`
  letter-folding + `makeNameCollator`, and `studentDisplayName`/`passageTitle` locale selection with
  AR fallback.
- **Every Zod schema has valid + invalid + localized-message-key tests.**
- **The three offline integration seams are covered** — analytics transform pipeline, reading-session
  recompute contract, and import classify pipeline — over fixtures, with no Supabase/network.
- **The `en`/`ar` catalog-parity test passes and would fail on a missing or mismatched key.**
- **RTL/localization tests assert actual direction (`dir="rtl"`) and rendered translated copy** — not
  merely that a component renders.
- **The Phase 15 `jest-axe` handoff is honored** — `vitest-axe` smoke on representative client
  components reports no violations.
- **Tests are colocated; conventions for future phases are documented in `docs/Testing.md`**, along
  with the explicit non-coverage list and its reasons.
- **No schema / SQL / auth-model / RLS / runtime-dependency changes** (devDependencies only); no
  product code changed except a name-preserving pure extraction if unavoidable.
- **`next build` + `eslint` green**; no Phase 17/18/19/20 work performed.

---

## Decision Log

> Append-only record of significant testing decisions made *while planning/implementing* Phase 16 —
> kept here so a future session understands not just *what* was tested but *why* something was tested,
> deferred, or declined, without re-deriving it. **`docs/Testing.md` holds the coverage map and
> conventions (the data); this log holds the reasoning.** Entry shape: `#### <date> — <title>` ·
> Decision (accepted / deferred / finding / assumption-change) · Context · Reasoning · Outcome.

### Entries

#### 2026-06-30 — Runner = Vitest; E2E deferred to Phase 19 (planning decisions)

- Decision: accepted (both, owner-confirmed during planning)
- Context: The locked stack ships **no** test runner. Two choices gate the phase: which runner, and
  whether browser E2E is in scope now.
- Reasoning: Vitest is native-ESM/TS-strict and friction-free with Next 16/React 19/Zod v4, added as
  devDependencies only (the Phase 14 `@next/bundle-analyzer` "dev tooling ≠ stack substitution"
  precedent). E2E needs a seeded Supabase test DB + environment that only exists at Deployment, so it
  moves to Phase 19; Phase 16 stays deterministic and offline.
- Outcome: Plan scoped to offline categories with E2E and server-action *wire*/RLS integration handed
  to Phases 19/17. The Phase 15 `jest-axe` automated-a11y handoff is absorbed here via `vitest-axe`;
  its Playwright keyboard half follows E2E to Phase 19.

#### 2026-06-30 — Correction: offline integration tests belong IN Phase 16

- Decision: assumption-change (owner-prompted)
- Context: The first rewrite collapsed *all* integration testing into E2E and deferred it wholesale.
  Owner pushed back: browser E2E / live Supabase / RLS should defer, but **offline integration** of
  pure, server-safe modules should not.
- Reasoning: Code review confirmed three genuine offline seams already in the codebase — the analytics
  transform pipeline (`search-params → time-range → aggregate → dashboard/shared`), the reading-session
  recompute contract (`schema → countWords → computeFluency`), and the import classify pipeline
  (`classify` composing `schema` + uniqueness + diffing). All are pure, deterministic, and DB-free;
  they are exactly the seams the server layer composes after its read, so testing them protects real
  cross-module contracts without any infrastructure.
- Outcome: Added a distinct **Offline Integration Tests** category (Method §2, Workstream 3, a DoD
  item), keeping four clear buckets — Unit · Offline Integration · Component/RTL · Localization — while
  E2E / live-DB / RLS / server-action wire stay deferred to Phases 19/17. Also recorded the
  `server-only` stub requirement surfaced by the same review (analytics modules import `server-only`,
  which throws under Vitest).

#### 2026-06-30 — Target audit: confidence over coverage (added 3, removed 2, de-duplicated)

- Decision: finding (owner-prompted audit against the seven test-quality principles)
- Context: Final pass to confirm every target tests an exported public API, protects a real invariant,
  is refactor-stable, needs no unnecessary mocks, and isn't coverage filler or a duplicate.
- Reasoning & changes:
  - **Added** three genuinely untested invariants that fit scope: `lib/collation.ts`
    (`normalizeForSearch`/`makeNameCollator` — the Arabic search/sort rule `arabic-rtl-i18n.md`
    explicitly flags, which fails silently); the **bilingual display accessors**
    (`studentDisplayName`/`passageTitle` + vocabulary peers — locale→AR/EN selection with AR fallback,
    user-visible everywhere); and **`startOfWeek`** (the non-obvious Saturday-start calendar rule).
  - **Removed** `generateUniqueStudentNumber` (its only logic is a retry loop over a mocked PostgREST
    builder chain — brittle, implementation-coupled, an external-service mock → Phase 19) and trimmed
    `lib/avatar.ts` to the two invariant-bearing functions (`avatarObjectPath`, `validateWebpUpload`),
    dropping the trivial string wrappers. Narrowed `generateStudentNumber` to format/charset (not
    statistical entropy) and `dashboard/data/shared` to `startOfWeek` only.
  - **De-duplicated** by writing an explicit unit-vs-integration division of labor (edge cases/field
    rules vs composition wiring) and collapsing the eight one-line role predicates into a single
    table-driven matrix test.
  - **Named, not silently dropped**, the in-spirit-but-out-of-scope invariants: account-status
    derivation and the service-coupled sagas (→ Phase 19), and the clock-coupled `dailyCountsTrend`
    (excluded as brittle).
- Outcome: A smaller, higher-confidence target set — every remaining test guards a stated invariant
  and survives refactoring. Reflected in Method §1/§2 and the DoD.

#### 2026-06-30 — Implementability audit: config concretized, deps pinned, prereqs closed

- Decision: finding (owner-prompted final consistency/implementability + dependency audit)
- Context: Verified the plan against the live repo — `tsconfig` (`@/* → ./*`), `eslint.config.mjs`
  (flat, `eslint-config-next`), `next.config.ts`, the i18n wiring (`i18n/routing.ts`,
  `messages/{ar,en}.json`, `LOCALES`/`DEFAULT_LOCALE` in `lib/constants.ts`), and every named target's
  exported surface.
- Findings & fixes (no redesign needed):
  - **Missing peer dep:** added `@testing-library/dom` (required by `@testing-library/react` v16);
    replaced the vague "+ `@types/*`" with an explicit *Test stack* table + a no-conflict analysis;
    pinned the **not-added** set (`@vitest/coverage-v8`, `vite-tsconfig-paths`, Playwright).
  - **Deprecated API avoided:** two environments via the `// @vitest-environment jsdom` docblock
    (default `node`), not `environmentMatchGlobs`.
  - **Concrete config:** manual `@` → root alias (mirrors `tsconfig`); explicit `server-only`/
    `client-only` empty stub at `test/stubs/empty.ts`; `renderWithIntl` sources named
    (`messages/*.json`, `getLocaleDirection`, `DEFAULT_LOCALE`).
  - **Closed prereqs:** ESLint stays green via explicit `vitest` imports (+ a scoped flat-config
    override if a rule misfires); clarified test files are **typechecked but not bundled** (corrected
    the imprecise "excluded from `next build`"); noted the Web Crypto (`crypto.getRandomValues`) Node
    ≥ 20 baseline for the `generateStudentNumber` test; recorded that the React Compiler is
    deliberately not wired into the runner.
- Outcome: Workstreams are non-overlapping (harness → unit → integration → localization → component →
  docs), each landing as a small reviewable commit; the DoD is objectively checkable; no config
  decision is deferred to mid-implementation. **Specification is implementation-ready.**
