# Bayan — Project Review (Phase 20, Final Refactor)

> Honest pre-release engineering review of the whole platform. Every claim here is grounded in the
> repository as it stands, not in aspiration. Where a limitation exists it is stated plainly.
> Companion evidence lives in the phase records: [`docs/Performance.md`](docs/Performance.md) (14),
> [`Accessibility.md`](Accessibility.md) (15), [`docs/Testing.md`](docs/Testing.md) (16),
> [`docs/Security.md`](docs/Security.md) (17), and [`docs/Deployment.md`](docs/Deployment.md) (19).
>
> **Verified gates at the time of this review** (`main`, Next.js 16.2.9): `tsc --noEmit` ✅ exit 0 ·
> `eslint .` ✅ 0 errors (5 benign warnings) · `next build` ✅ exit 0, 30 routes generated.

---

## Strengths

Only strengths supported by the code are listed.

- **Architecture — feature-based and consistent.** Every domain lives under `features/<domain>/` with
  the same internal shape (`queries.ts`, `actions.ts`, `schemas.ts`, `types.ts`, `components/`). There
  are no type-based dumping grounds; the data layer is typed query wrappers, never ad-hoc
  `.from("table")` calls in components. The naming contract in
  [`.claude/rules/naming-conventions.md`](.claude/rules/naming-conventions.md) is followed literally
  across 12+ phases.

- **Server/client boundary discipline.** Reads are `import "server-only"` and gated by `requireRole`
  before any query. The two Supabase clients are cleanly separated: the RLS-respecting
  `supabaseServerClient` for user-scoped work, and the service-role `supabaseAdminClient` — the latter
  contained entirely in `lib/supabase/admin.ts` behind `server-only`, with the service-role key never
  reachable from a client-importable module (`lib/supabase/env.ts` deliberately omits it).

- **Security is enforced in depth (Phase 17).** Role-aware, least-privilege RLS (`is_staff()`,
  `is_my_student()`) is applied to the live database *and* mirrored by `requireRole` at the data layer
  and role guards in the UI. Profile self-edits are column-scoped (`full_name`/`avatar_url` only) so a
  client cannot escalate its own `role`. This is a genuine defense-in-depth posture, documented with a
  verified audit baseline in [`docs/Security.md`](docs/Security.md).

- **Localization & RTL are first-class, not bolted on.** Arabic is the default locale; `proxy.ts`
  handles locale routing and session refresh in one pass; the sitemap emits hreflang alternates; Zod
  validation messages are localized on both client and server via the paired
  `useValidationMessages`/`getValidationMessages` helpers. Arabic collation is handled explicitly
  (`features/students/data/collation.ts`) rather than relying on locale-naive sort.

- **Type safety.** Strict TypeScript with a genuinely clean `tsc --noEmit`. No `any` escape hatches in
  the feature code; runtime boundaries are validated with Zod.

- **Accessibility built in from Phase 3, audited in Phase 15.** Semantic markup, focus management, and
  RTL-correct reading order were designed in, then verified in a dedicated audit with a findings
  register ([`Accessibility.md`](Accessibility.md)). The static gate is the `jsx-a11y` subset already
  active via `eslint-config-next`.

- **Measured performance work (Phase 14).** The heaviest dependency (`xlsx`, ~160 KB gzip) was moved
  off the Students first-load path to an on-demand import, and a redundant per-render `auth.users` scan
  on `/teachers` was removed with a request-scoped React `cache()`. Both changes are backed by
  before/after measurements in [`docs/Performance.md`](docs/Performance.md).

- **Testing.** A Vitest suite (146 tests) covers the permission matrix, role-change rules, fluency
  math, import classification, and i18n routing — the logic most costly to regress.

- **Developer experience & documentation.** A disciplined "one fact, one home" convention: numbers live
  in the evidence docs, reasoning in the phase docs, and current behavior in
  [`docs/project/current-architecture.md`](docs/project/current-architecture.md). Env validation
  fails fast at startup, so a misconfigured deploy breaks loudly, not silently.

---

## Weaknesses

Stated honestly. None are invented; none are hidden.

- **Student deletion destroys reading history (finding D1 — accepted trade-off).**
  `reading_sessions.student_id → students.id` is `ON DELETE CASCADE`, and `deleteStudentAction` issues
  a direct `delete().eq("id", id)` with no pre-delete history check. The code still branches on a
  `23503` foreign-key error, but a `CASCADE` child never raises `23503`, so under the live schema that
  branch never fires — the delete succeeds and silently takes the student's reading history with it.
  A delete matching zero rows also returns `{ ok: true }` (no "not found" signal). The correct fix is a
  schema change (`CASCADE` → `RESTRICT`), which is **locked** and out of scope; the realistic
  mitigation is an app-level pre-delete guard. Per the Phase 20 decision this is **documented, not
  changed** — see Future Improvements and [`docs/Security.md`](docs/Security.md) D1.

- **Large list reads are unbounded by design.** `getStudents`, `getPassages`, and `getVocabularyTerms`
  load the *entire* table and paginate/sort/filter client-side in TanStack Table (a deliberate choice
  so Arabic collation is correct). This is appropriate at single-school scale and the code says so, but
  it is a real ceiling: `vocabulary_terms` spans every passage, and the roster grows across schools.
  This is the crux of the Scaling Strategy below.

- **Per-render `auth.users` scans on `/students` and `/teachers`.** Account status (`invited` vs
  `active`) is derived from `auth.users.last_sign_in_at`, which lives in the auth schema, so each render
  performs one bounded full admin-list scan (`perPage: 200`, ≤ 50 pages). Phase 14 removed the
  *redundant* second scan on `/teachers` but the inherent scan remains, because eliminating it would
  require storing sign-in state in `public` — a forbidden schema change.

- **Reserved-but-unbuilt Zustand stores.** `useReadingStore`, `useSettingsStore`, `useAnalyticsStore`,
  `useAuthStore`, and `useStudentStore` are named in the conventions but intentionally not implemented
  (state is server-resolved per request or lives in context providers). This is a deliberate,
  documented decision rather than debt — but a newcomer will see the names before they see the
  rationale, so it is worth naming here.

- **No automated end-to-end / RLS-assertion tests.** The Vitest suite covers pure logic and the
  permission matrix, but there is no seeded-DB integration test that asserts a student *cannot* read
  another student's row through a real request. Phase 17 verified this manually; it is deferred, not
  automated.

---

## Future Improvements

Each ties directly to something in this repository; no generic advice.

1. **App-level pre-delete history guard for students (mitigates D1).** Before `deleteStudentAction`
   deletes, count that student's `reading_sessions`; if any exist, refuse with the already-localized
   "has history" message instead of cascading. This restores the *documented, intended* behavior
   without a schema change, and closes the silent-data-loss gap. (Deliberately **not** implemented in
   Phase 20 per the owner decision; recorded here as the recommended next step.)

2. **Server-side pagination for the roster and content tables when scale demands it.** Keep the current
   client-collation approach as the default, but add cursor/range-based server pagination
   (`.range()`, already used in analytics) behind the same query functions once any table realistically
   exceeds a few thousand rows — starting with `vocabulary_terms` (all-passages) and the multi-school
   roster. The query wrappers are the single change point, so this is additive, not a rewrite.

3. **A `students`/`teachers` account-status cache at larger scale.** If the user base grows into the
   high thousands, wrap the bounded `auth.users` listing in a short-TTL cross-request cache (accepting
   the staleness/invalidation cost only when the scan cost is actually felt). Phase 14 explicitly
   deferred this to here as "not justified now — no measured pain."

4. **Automated cross-user RLS assertions in CI.** A seeded test project plus a small integration suite
   that asserts the Phase 17 verification matrix (student cannot read/write another student's data)
   would turn a manual check into a regression guard. Phase 17 deferred exactly this.

---

## Technical Decisions

Why the choices actually in use make sense for this product.

- **Next.js 16 App Router + React Server Components.** Bayan is read-heavy and role-gated. Rendering
  role-scoped data on the server (with `requireRole` before any query) keeps the client bundle small,
  keeps authorization off the client, and lets each route be dynamic where it must be and static where
  it can (the marketing/auth pages and `robots`/`sitemap` are static). The client boundary is pushed
  down to leaf interactive components (tables, dialogs).

- **Server Actions for mutations.** Every write (roster CRUD, role change, session completion, settings,
  import commit) is a server action that re-validates with the same Zod schema and re-checks the role.
  This removes a hand-written API layer while keeping validation and authorization server-side — the
  client is never trusted.

- **Supabase (Postgres + RLS + Auth + Storage).** A single backend that provides the relational model
  the product needs (students → sessions → passages), row-level security as an independent enforcement
  layer, and auth/storage without extra services. The identity model
  (`auth.users.id ↔ profiles.id ↔ students.profile_id`) leans directly on Postgres FKs.

- **TypeScript (strict) + Zod.** Compile-time guarantees across the typed data layer, plus runtime
  validation at every client/server boundary, with localized error messages — appropriate for a form-
  and data-heavy product where a bad row must fail with an Arabic message, not a stack trace.

- **next-intl.** Locale routing, per-locale metadata, and localized validation are core requirements for
  an Arabic-first product, not add-ons; next-intl handles routing, the request pipeline, and message
  resolution in one integrated system that the `proxy.ts` middleware ties to session refresh.

- **Tailwind CSS 4 + shadcn/ui (Radix).** A single token-driven design system with accessible,
  RTL-aware primitives — consistent spacing/typography/dark-mode across every screen without a bespoke
  component framework.

- **TanStack Table + client collation.** Chosen specifically so Arabic search/sort is correct (a locale
  collator in the browser), which server-side `ORDER BY` would not guarantee. The trade-off (loading
  the full table) is the accepted cost documented above.

---

## Scaling Strategy

Grounded in what is actually built — no Redis/Kubernetes/microservices/queues, because there is no
evidence they are needed at this product's scale.

**As students and the roster grow.** The roster page loads every `students` row and paginates in the
browser. At one school (hundreds of students) this is fine and fast. The first pressure point is the
multi-school roster and the *all-passages* `vocabulary_terms` table. Mitigation is already scoped
(Future Improvement 2): move pagination server-side via `.range()` behind the existing query wrappers,
keeping client collation for the current page. No architectural change — the query function is the only
edit site.

**As reading sessions grow.** Reads are already **bounded**: analytics caps at
`ANALYTICS_SESSION_LIMIT = 2000`, history at `HISTORY_LIMIT = 200`, dashboards at
`STATS_SAMPLE_LIMIT = 500` / `INSIGHT_SAMPLE_LIMIT = 1000`. Aggregation happens in TypeScript over a
bounded sample, so session-table growth does not degrade these surfaces linearly — it is capped by
design. The main index assumption is that `reading_sessions` is queried by `student_id` and ordered by
recency; those access paths should stay indexed as volume grows.

**As passages/vocabulary grow.** Same shape as the roster: bounded where read for computation
(`PASSAGE_SCAN_LIMIT = 2000` on the student dashboard), unbounded on the management tables. The
management tables are the ones to move to server pagination first if a content library gets large.

**As schools/teachers grow.** The one non-linear cost is the per-render `auth.users` scan on
`/students` and `/teachers` (bounded, but `O(users / 200)` admin calls). Phase 14 removed the redundant
scan; the remaining one is cheap at school scale and has a documented mitigation (Future Improvement 3)
if the user base reaches the high thousands.

**Rendering.** Authenticated pages are dynamic (server-rendered per request, correct for role-scoped
data); public pages, `robots`, and `sitemap` are static. Caching is deliberately **request-scoped only**
(React `cache()`), never persistent `use cache` on user-scoped reads — persistent caching of
cookie-bound data risks cross-user leakage and is intentionally avoided (Phase 14 decision log).

**Net:** the platform scales comfortably at its intended school/center scale today, and the two things
that bend first (management-table pagination, the account-status scan) each have a concrete, additive
mitigation that changes one function, not the architecture.

---

## Final Architecture Review

- **Folder structure & feature organization** — clean and consistent; no changes recommended.
- **Routing** — App Router with `[locale]` segment, `(auth)`/`(app)` groups, and `proxy.ts` unifying
  locale routing + session refresh. Correct and coherent.
- **Localization** — centralized in `i18n/` and `lib/constants`, no hardcoded locale strings.
- **Data flow** — server reads (`queries.ts`) → server actions (`actions.ts`) → typed view models →
  presentational components. Consistent across features.
- **Supabase integration** — session vs. admin client separation is correct and the service-role key is
  properly contained.
- **Separation of concerns / server-client boundaries** — client boundary kept at leaf level; good.
- **Shared utilities** — `lib/` (routes, site-url, constants, avatar, validation, errors) is reused,
  not duplicated per feature.

**Improved during Phase 20 (scoped, no redesign):**
- Removed the temporary `app/[locale]/ui` design-gallery route, which was explicitly marked "remove
  before production" and was still shipping (statically generated at `/ar/ui` and `/en/ui`, publicly
  reachable, and absent from the `robots.txt` disallow list).
- Reconciled two stale docs to the live database: the student-delete FK semantics in
  [`docs/database/manual-supabase-configuration.md`](docs/database/manual-supabase-configuration.md) §5
  and [`docs/project/current-architecture.md`](docs/project/current-architecture.md) §"students", both
  now pointing at [`docs/Security.md`](docs/Security.md) D1.

No structural refactoring was performed or is recommended — the architecture is sound for long-term
maintenance.

---

## Production Readiness Checklist

Cross-references prior phases rather than re-deriving them.

| Area | Status | Source |
|---|---|---|
| Accessibility audit | ✅ Complete (awaiting owner manual AT testing) | Phase 15 — [`Accessibility.md`](Accessibility.md) |
| Security review / RLS tightening | ✅ Applied to live DB | Phase 17 — [`docs/Security.md`](docs/Security.md) |
| Performance baseline & optimizations | ✅ Measured | Phase 14 — [`docs/Performance.md`](docs/Performance.md) |
| Automated tests | ✅ 146 Vitest tests | Phase 16 — [`docs/Testing.md`](docs/Testing.md) |
| Deployment process & rollback | ✅ Documented | Phase 19 — [`docs/Deployment.md`](docs/Deployment.md) |
| Env fail-fast validation | ✅ `lib/supabase/env.ts` + `instrumentation.ts` | Phase 19 |
| Error/loading/empty states | ✅ Per-route `error.tsx` / `loading.tsx` present | — |
| Temporary dev artifacts removed | ✅ `/ui` gallery deleted | Phase 20 |
| Documentation reconciled to live DB | ✅ §5 / §students corrected | Phase 20 |
| Student-delete history integrity (D1) | 🟡 Documented accepted trade-off (no code change) | [`docs/Security.md`](docs/Security.md) |
| Automated cross-user RLS tests | ❌ Deferred (manual verification only) | Phase 17 |

---

## Deployment Readiness Checklist

| Item | Status |
|---|---|
| Production build (`next build`) | ✅ exit 0, 30 routes |
| Lint (`eslint .`) | ✅ 0 errors (5 documented React-Compiler warnings on TanStack Table) |
| Typecheck (`tsc --noEmit`) | ✅ clean |
| Required env vars documented + templated | ✅ `.env.example` + `docs/Deployment.md` |
| Env validation fails fast | ✅ public vars at import; service-role key in `instrumentation.ts` |
| `metadataBase` / canonical / hreflang | ✅ per-locale, resilient `getSiteUrl` |
| `robots.txt` | ✅ disallows `/api/` + all `(app)` routes for both locales |
| `sitemap.xml` | ✅ public pages only, hreflang alternates |
| Production configuration | ✅ `next.config.ts` (React Compiler, global 404, analyzer gated); no `vercel.json` needed (documented) |
| Rollback procedure | ✅ documented (Vercel instant rollback) |

---

## Summary checklist

- ✅ **Complete:** build/lint/typecheck green · feature architecture · security (Phase 17) ·
  accessibility (Phase 15) · performance (Phase 14) · testing (Phase 16) · deployment (Phase 19) ·
  env validation · robots/sitemap/metadata · `/ui` removed · docs reconciled.
- 🟡 **Needs improvement (documented, not blocking):** student-delete history guard (D1) ·
  server-side pagination for large tables · account-status scan cache at high scale.
- ❌ **Missing (deferred by decision):** automated cross-user RLS assertions in CI.

The platform is production-ready for its intended school/center scale. The open items are honest,
bounded, and each has a concrete, additive path forward that does not require redesigning the
architecture or touching the locked schema.
