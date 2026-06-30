# Testing — coverage map & conventions (Phase 16)

> **Living record for the test suite.** This is the companion evidence doc for
> [`docs/phases/16-testing.md`](phases/16-testing.md): the phase file holds the *plan and decision
> log*; this file holds the *coverage map and the conventions every future phase must follow*. Same
> one-home-per-fact split as `docs/Performance.md` (Phase 14) and `Accessibility.md` (Phase 15).
>
> **Guiding principle:** maximum confidence with the smallest realistic, maintainable suite. Every
> test guards a documented invariant or business rule and tests **public behavior**, never
> implementation details — so the suite survives refactoring. Coverage percentage is **not** a goal.

---

## How to run

```bash
npm run test         # one-shot, CI/non-watch (the green-suite gate)
npm run test:watch   # watch mode during development
```

- **Runner:** Vitest (dev tooling only — entirely separate from the Next 16 / Turbopack build).
- **Environments:** default **node** (Unit, Offline-Integration, Localization). Component/RTL files
  opt into **jsdom** with a `// @vitest-environment jsdom` docblock on the first line.
- **Config:** [`vitest.config.ts`](../vitest.config.ts) — the `@` alias mirrors `tsconfig`;
  `server-only`/`client-only` are aliased to an empty stub; the public `NEXT_PUBLIC_SUPABASE_*` env
  vars are supplied throwaway values so import-time-validated modules load (no real service is
  contacted).
- **Setup:** [`test/setup.ts`](../test/setup.ts) registers the `@testing-library/jest-dom` and
  `vitest-axe` matchers and a minimal `matchMedia` stub.

## Shared test scaffolding (under `test/`, never in `features/`)

| File | Purpose |
| --- | --- |
| [`test/render-with-intl.tsx`](../test/render-with-intl.tsx) | Renders a client component with the **real** `ar`/`en` catalogs + the locale's text direction, wired as the root layout does (so RTL/copy assertions reflect production). |
| [`test/fixtures.ts`](../test/fixtures.ts) | Deterministic builders — a `reading_sessions` row, an import row, an existing roster snapshot. |
| [`test/a11y.ts`](../test/a11y.ts) | `axe` + `AXE_FRAGMENT_OPTIONS` (disables `region` / `color-contrast`, which can't run on a jsdom fragment). |
| [`test/stubs/empty.ts`](../test/stubs/empty.ts) | The `server-only` / `client-only` alias target. |
| [`test/vitest-axe.d.ts`](../test/vitest-axe.d.ts) | Type augmentation so `toHaveNoViolations()` type-checks under `tsc`. |

---

## Coverage map (what each test protects)

Tests are **colocated** with the unit under test (`fluency.ts` → `fluency.test.ts`); offline
integration tests are named `*.integration.test.ts` next to their lead module.

### 1. Unit tests (pure single-module logic + schema contracts)

| Test | Invariant / rule it protects |
| --- | --- |
| `features/reading/sessions/fluency.test.ts` | The core WPM/accuracy formulas + degenerate-input guards (zero duration → 0, zero words → 0, error clamp). |
| `features/analytics/time-range.test.ts` | Deterministic windowing per range; `all` → null comparison. |
| `features/analytics/aggregate.test.ts` | KPI comparable/null + neutral deadband; empty bucket `null` (averages) vs `0` (counts); `MAX_BUCKETS` cap. |
| `features/analytics/search-params.test.ts` | The analytics URL-param contract (defaults, invalid coercion, cohort-vs-student). |
| `features/analytics/reading/insights.test.ts` | Which reading insight fires for which metric shape; each kind at most once. |
| `features/auth/roles.test.ts` | The permission matrix per role (one table-driven test) + every `canChangeRole` rule (Phase 12.6 security invariant). |
| `features/students/identity/student-number.test.ts` | The claim-secret `BYN-XXXXXXXX` format + charset (not statistical entropy). |
| `features/dashboard/data/shared.test.ts` | `startOfWeek` Saturday-start (Arabic-locale week). |
| `lib/collation.test.ts` | Arabic search/sort: `normalizeForSearch` letter-folding + `makeNameCollator` ordering. |
| `features/students/types.test.ts`, `features/reading/types.test.ts` | Bilingual display accessors — locale→AR/EN selection with AR fallback. |
| `lib/avatar.test.ts` | `avatarObjectPath` object-path-not-URL invariant + `validateWebpUpload` guard. |
| `features/**/schemas.test.ts`, `features/settings/profile-schemas.test.ts` | Every `build*Schema`: valid/invalid/boundary + the correct localized message key (doubles as the Server Action input contract). |

### 2. Offline integration tests (multiple server-safe modules composed — no DB)

| Test | Composition it proves |
| --- | --- |
| `features/analytics/analytics-transform.integration.test.ts` | `search-params → time-range → aggregate → dashboard/shared`: URL params → window/granularity → bucketed trend series → KPI indicator (what `getCohortReadingAnalytics` composes after its read). |
| `features/reading/sessions/recompute-contract.integration.test.ts` | `schema → countWords → computeFluency` + the `errors > wordCount` guard — the DB-free recompute path of `completeReadingSessionAction`. |
| `features/students/import-export/classify.integration.test.ts` | `classify` composing the student schema + within-file uniqueness + roster diffing into create/update/skip/reject + counts. |

### 3. Component / RTL / a11y tests (jsdom, small & representative)

| Test | What it asserts |
| --- | --- |
| `features/analytics/components/student-picker.test.tsx` | The Phase-15 live-count announcement renders **real translated** Arabic/English copy (count interpolated); a11y-clean. |
| `features/auth/components/text-field.test.tsx` | BiDi: an email field stays `dir="ltr"` inside an RTL page; accessible error wiring; a11y-clean. |
| `features/auth/components/form-alert.test.tsx` | Announced `role="alert"`; a11y-clean. |

### 4. Localization tests (catalog integrity)

| Test | What it asserts |
| --- | --- |
| `messages/parity.test.ts` | `en` ↔ `ar` leaf key-set equality, no empty strings, identical interpolation **argument names** per key (plural *arms* may differ — Arabic has more categories). |
| `i18n/routing.test.ts` | Locale config (ar+en, ar default) + `getLocaleDirection` (ar → rtl, en → ltr). |

---

## Conventions for future phases (required)

- **Every new pure helper** ships a colocated unit test that asserts its invariant — not its
  internals.
- **Every new composition seam** of pure, server-safe modules ships an offline integration test
  (fixtures, no DB).
- **Every new Zod schema** ships valid + invalid + localized-message-key tests.
- **Every new locale key** must keep `en`/`ar` parity, or `messages/parity.test.ts` fails. Add the
  Arabic counterpart in the same change.
- **Tests are colocated** (`*.test.ts(x)` next to the source); never a parallel `__tests__/` tree.
- **Test public behavior only.** If a test needs a private internal, that's a signal the assertion is
  at the wrong level — test through the public API instead.
- **Determinism:** pass `now`/inputs explicitly; no clock reads, no fake timers, no randomness in
  assertions.
- **Mocks are a last resort, at the boundary only** — e.g. the `server-only` alias and the
  `@/i18n/navigation` primitive stub. Never mock the unit under test's own logic.
- **No coverage gate.** Add a test because it guards something real, not to move a number.

---

## Explicitly not covered here (and why)

- **End-to-end / live-database flows** (login, registration saga, `student_number` claim, activation
  links, completing a real reading session, a role change), **server-action *wire* behavior**, and
  **RLS verification** → **Phase 19** (Deployment/CI, where a seeded Supabase test DB + environment
  exist). Phase 16 is deterministic and offline. RLS *tightening* is **Phase 17**.
- **The Playwright keyboard/screen-reader runs** Phase 15 forwarded → **Phase 19** (browser E2E). The
  `jest-axe` half of that handoff is covered here via `vitest-axe`.
- **Student account-status derivation** (`roster_only`/`invited`/`active`) — computed inside
  server-only `getStudentAccountStatusMap` against the Auth admin API; testing it needs a
  production-only extraction or a GoTrue mock → **Phase 19**.
- **Third-party libraries** (Radix, TanStack Table, Zod's engine, next-intl's formatter) and
  **memoization** (the React Compiler owns it).
- **`dailyCountsTrend`** — reads the clock internally (no injectable `now`); brittle, low-invariant.
- **`avatarPublicUrl` / `avatarStorageKey` / `isAcceptedAvatarType`** — trivial string/`includes`
  wrappers; the object-path invariant is covered via `avatarObjectPath`.
