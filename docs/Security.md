# Bayan — Security Review (Phase 17)

> **Companion doc to** [`docs/phases/17-security-review.md`](phases/17-security-review.md) (the plan +
> decision log). **This file is the living findings register + verification matrix.** Same
> one-home-per-fact split as `docs/Performance.md` (14), `docs/Accessibility.md` (15), and
> `docs/Testing.md` (16).
>
> **Source-of-truth & evidence policy.** During this review `supabase/setup.sql` was **NOT
> authoritative** (a historical bootstrap); it has since been **removed** and replaced by the canonical
> [`supabase/schema.sql`](../supabase/schema.sql). Authorization behavior is confirmed **only** from the live
> database (queries the owner runs; this environment has no Supabase access) and from the
> implementation. Every claim is tagged **Verified** (owner-supplied live output, or read from code) /
> **Inferred** (from code + docs, not confirmed live) / **Unknown** (needs verification).

---

## 1. Live audit — Verified baseline

**Audit date:** 2026-06-30. **Method:** 11 read-only catalog queries (Q1–Q11) + 2 follow-ups (T1–T2)
run by the owner in the Supabase SQL editor; outputs pasted back. Full query set in
`docs/phases/17-security-review.md` → "Workstream 0". RLS is **enabled (not FORCEd)** on all six app
tables and on `storage.objects` (Q2, Q8) — adequate, since the session/anon clients are not table
owners.

### 1a. The decisive fact — grants are wide open; RLS is the sole gate · **Verified (Q3, Q4)**

`authenticated` (and `anon`) hold table-level **SELECT/INSERT/UPDATE/DELETE** on `students`,
`reading_sessions`, `reading_passages`, `vocabulary_terms`, `user_settings` (Supabase defaults). For
those tables **RLS is the only access control**, and every policy is `using(true)`/`with check(true)`.
The lone exception confirms the model: **`profiles` has no table-level `UPDATE` grant** to
`authenticated`; column-level `UPDATE` is granted on **`full_name` + `avatar_url` only** (Q4) — the
Phase 12.6 §3a hardening, live.

> **`manual-supabase-configuration.md` §3 no longer matches the live database configuration.** It
> describes roster/content writes as "privileged writes via service-role," but the live policies let
> *any authenticated user* write them. The session-client write paths work because of these permissive
> policies, not because writes are service-role-gated. The doc is outdated relative to the current live
> DB and is corrected in Workstream 4.

### 1b. Per-table policy + grant map · **Verified (Q1, Q3)**

| Table | SELECT | INSERT | UPDATE | DELETE | Verdict |
|---|---|---|---|---|---|
| `profiles` | own (`auth.uid()=id`), `{public}` | none (no policy → RLS denies) | own row; **columns `full_name`/`avatar_url` only** (grant) | none | ✅ tight (12.6) |
| `user_settings` | own (`=user_id`) | own | own | none | ✅ tight |
| `students` | `true` `{authenticated}` | `true` | `true` | `true` | ❌ fully permissive |
| `reading_sessions` | `true` `{authenticated}` | `true` | none | none | ❌ permissive read+insert |
| `reading_passages` | `true` `{authenticated}` (intended) | `true` | `true` | `true` | ❌ writes permissive |
| `vocabulary_terms` | `true` `{authenticated}` (intended) | `true` | `true` | `true` | ❌ writes permissive |

Policy names (for the Workstream 1 `drop policy if exists` targets): `students_authenticated_select` /
`_insert` / `_update` / `_delete`; `reading_sessions_select_own` (misnamed — predicate is `true`) /
`reading_sessions_insert_authenticated`; `reading_passages_authenticated_select` / `_insert` /
`_update` / `_delete`; `vocabulary_terms_authenticated_select` / `_insert` / `_update` / `_delete`;
`profiles_select_own` / `profiles_update_own`; `settings_select_own` / `settings_insert_own` /
`settings_update_own`. `anon` is effectively denied data: it holds grants but no permissive policy
targets it (the `{public}` policies are `auth.uid()`-scoped, which an anon never satisfies).

### 1c. Storage · **Verified (Q7, Q8, Q9)**

All four `storage.objects` policies present — `avatars_owner_insert` / `_update` / `_delete`
(owner-scoped to `{user_id}/`) + `avatars_public_read` (`{public}` SELECT, load-bearing for the upsert
path per §6a). Bucket `avatars`: **public**, `file_size_limit` 1 MB, MIME `image/webp,image/png,image/jpeg`.
Matches Phase 12.6 §6/§6a. **No change needed.**

### 1d. Functions & triggers · **Verified (Q5, Q6, T1, T2)**

- `handle_updated_at()` — plpgsql, the `BEFORE UPDATE` `updated_at` trigger fn (on `profiles`,
  `reading_passages`, `students`, `user_settings`; T1). `reading_sessions`/`vocabulary_terms` have no
  `updated_at` column, hence no such trigger.
- `rls_auto_enable()` — **SECURITY DEFINER**, `search_path=pg_catalog`; run by event trigger
  **`ensure_rls`** (`ddl_command_end`, owner `postgres`) to **auto-enable RLS on newly created tables**.
  A protective custom measure; benign; irrelevant to policy/function work. The other six event triggers
  are stock Supabase (`pgrst_*`, `issue_pg_*`).
- **No `BEFORE DELETE` trigger exists anywhere** (T1) — nothing intercepts a delete before its FK.
- Planned helpers `is_staff()` / `is_my_student(uuid)` **do not collide** with existing names.

### 1e. FK `ON DELETE` semantics · **Verified (Q11)**

`profiles.id`→auth.users **CASCADE**; `user_settings.user_id`→auth.users **CASCADE**;
`students.profile_id`→profiles **SET NULL** (identity bridge — account deletion preserves the roster
row); `reading_sessions.passage_id`→reading_passages **CASCADE**;
`vocabulary_terms.passage_id`→reading_passages **CASCADE**; **`reading_sessions.student_id`→students
CASCADE** (the only FK referencing `students`).

---

## 2. Findings register

Severity = impact if RLS is the only thing standing (a forged request / direct PostgREST call), since
app code currently scopes correctly through the UI.

| # | Sev | Tag | Surface | Confirmed behavior | Evidence |
|---|---|---|---|---|---|
| **F1** | **Critical** | Verified | `students` SELECT `true` | Any authenticated user (incl. any student) reads the **entire roster**: names, emails, birth dates, and **`student_number` — the claim secret**. Enables enumeration + claiming others' unlinked rows (the claim guard is only `profile_id IS NULL`). | Q1, Q3 |
| **F2** | High | Verified | `reading_sessions` SELECT `true` | Any student reads **every other student's** reading history. | Q1, Q3 |
| **F3** | High | Verified | `reading_sessions` INSERT `true` | Any authenticated user **forges sessions for any `student_id`** — pollutes the core metric, dashboards, analytics. | Q1, Q3 |
| **F4** | High | Verified | `students` INSERT/UPDATE/**DELETE** `true` | Any authenticated user can **create/modify/delete any roster row** directly, bypassing `requireRole`. With the CASCADE FK, a direct DELETE also **destroys that student's reading history** (see D1). | Q1, Q3, Q11 |
| **F5** | High | Verified | `reading_passages` & `vocabulary_terms` writes `true` | Any authenticated **student** can create/edit/delete reading content & vocabulary, bypassing `canManageContent`. | Q1, Q3 |
| **F6** | — | Verified tight | `profiles` SELECT own; UPDATE column-scoped | Already correct (12.6 live). **No change.** | Q1, Q3, Q4 |
| **F7** | — | Verified tight | `user_settings` own-row R/I/U | Already correct. **No change.** | Q1, Q3 |
| **F8** | — | Verified tight | avatars / `storage.objects` | Four policies + Public/1 MB/MIME all correct (12.6). **No change.** | Q7, Q8, Q9 |

### D1 — `students` delete cascades reading history (data-integrity)

**Verified from the live database (Q1, Q3, Q11, T1) — database configuration only:**
- `students` DELETE is permitted at the data layer: policy predicate `true`, DELETE grant present, and
  **no `BEFORE DELETE` trigger** on `students`.
- `reading_sessions.student_id` → `students` is **`ON DELETE CASCADE`**, and `reading_sessions` is the
  **only** FK referencing `students`.
- Therefore, at the database level, a `DELETE` of a `students` row that has reading sessions **cascades
  and removes those `reading_sessions`** rather than raising a `23503` foreign-key violation.

**Application execution-path review (read-only, 2026-06-30) — code-Verified.** Traced
`DeleteStudentDialog` → `deleteStudentAction` → DB
([components/delete-student-dialog.tsx:49](../features/students/components/delete-student-dialog.tsx#L49);
[features/students/actions.ts:301-331](../features/students/actions.ts#L301-L331)):

- `deleteStudentAction` gates on `requireRole("admin","teacher")` (non-staff redirected before any
  DB call), then a `!id` guard, then issues `supabaseServerClient().from("students").delete().eq("id", id)`
  **directly**. **Verified.**
- **No pre-delete check for `reading_sessions`** anywhere in the path (`reading_sessions` is referenced
  nowhere in `features/students/`); the only history "protection" is **reactive** — branching on a
  returned `error.code === "23503"`. **Verified.**
- The `hasHistory` copy is produced **only** by `error.code === "23503"`, which requires a child FK with
  `RESTRICT`/`NO ACTION`. Combined with the Verified Q11 config (the sole `students` child,
  `reading_sessions`, is `CASCADE`), a staff delete of a student with sessions **cascades and removes
  that history and does not raise `23503`** — so the documented refuse-on-history branch **is not
  produced under the current schema**. **Verified (code) + Verified (Q11).** (Edge: "no table *outside*
  the six app tables references `students`" rests on the locked six-table schema, not a
  `confrelid='students'` query — **Inferred**; promotable with one more read-only query.)
- Side observation: a `delete().eq("id", id)` matching **zero rows** returns no error → the action
  reports `{ ok: true }` though nothing was deleted. **Verified (code).**

This database configuration **no longer matches** the behavior described in
`manual-supabase-configuration.md` §5 / `current-architecture.md` §12 (which state deletion of a student
with history is refused via `23503`); those docs are outdated relative to the current live DB. Two
separable concerns:

- **Security half (F4):** *any authenticated user* can trigger this via direct PostgREST → closed by
  tightening `students` DELETE to staff-only (Workstream 1).
- **Integrity half (D1):** **code-confirmed** (review above) — a legitimate admin/teacher delete reaches
  a direct DB `DELETE` with no pre-delete history check, so combined with the CASCADE FK it removes the
  student's reading history, and the documented refuse-on-history behavior is not produced. Remediation
  would be either changing the FK to `RESTRICT`/`NO ACTION` (**schema change — out of Phase 17 scope**,
  locked-schema rule) or an app-level pre-delete history check (**behavior change — out of the current
  "no app change" scope**). **Recorded as a flagged finding for an owner decision; not changed in Phase
  17 unless scope is explicitly expanded.**

### Already-built controls re-verified (confirm, not rebuild)

- **Service-role key containment · Verified (code):** `SUPABASE_SERVICE_ROLE_KEY` read only in
  `lib/supabase/admin.ts` behind `import "server-only"`, never via `lib/supabase/env.ts`; no
  client-importable module references it.
- **Server-side authz + Zod re-validation · Verified (code + Phase 16 tests):** every mutation calls
  `requireRole(...)` and re-validates with the same Zod schema; the capability matrix + every
  `canChangeRole` rule are covered by the Phase 16 suite.
- **Route protection · Verified (code):** `requireUser`/`requireRole`/`redirectIfAuthenticated`;
  `proxy.ts` matcher excludes only `api`/`_next`/static.
- **Avatar upload validation · Verified (code + Q9):** `validateWebpUpload` (webp + ≤1 MB) + bucket
  limit + MIME allow-list.

---

## 3. Remediation — APPLIED (Phase 17 Workstream 1)

> **Status: authored, owner-applied to the live DB, and verified.** The migration lives at
> [`supabase/schema.sql`](../supabase/schema.sql)
> (idempotent, transactional). A full compatibility review confirmed **no application-code change was
> required** — every session-client and service-role data path (dashboards, roster CRUD, CSV import,
> analytics, reading sessions, claim/activation/reconcile, settings/profile/avatar) keeps working under
> the new policies. Manual verification passed. The model below is what was applied.

**Strategy (owner-confirmed during planning): role-aware RLS, zero app-code changes.** Two
`SECURITY DEFINER` helpers (`is_staff()` = current user is admin/teacher; `is_my_student(uuid)` = current
user owns the `students` row via `profile_id`), `search_path`-pinned, `execute` to `authenticated` only.
**No grant changes** — the broad table grants stay; tightened RLS does the gating, keeping every
session-client path working.

| Table | SELECT → | INSERT → | UPDATE → | DELETE → |
|---|---|---|---|---|
| `students` | `is_staff() OR profile_id = auth.uid()` | `is_staff()` | `is_staff()` | `is_staff()` |
| `reading_sessions` | `is_staff() OR is_my_student(student_id)` | `is_my_student(student_id)` | (none) | (none) |
| `reading_passages` | keep `true` (all read content) | `is_staff()` | `is_staff()` | `is_staff()` |
| `vocabulary_terms` | keep `true` | `is_staff()` | `is_staff()` | `is_staff()` |
| `profiles`, `user_settings` | **no change** (F6/F7 already tight) | | | |

Student self-claim is unaffected (it updates `students.profile_id` via the **admin** client, which
bypasses RLS).

---

## 4. Verification matrix (run AFTER Workstream 1 is applied)

| As | Attempt | Expect |
|---|---|---|
| student | session-client SELECT another student's `students` row (incl. `student_number`) | 0 rows |
| student | session-client SELECT another student's `reading_sessions` | 0 rows |
| student | INSERT a `reading_sessions` row with a foreign `student_id` | denied |
| student | UPDATE/DELETE any `students` row; INSERT/UPDATE/DELETE any passage/vocabulary | denied |
| student | own reading history + complete a session | works |
| teacher/admin | roster list + CRUD + CSV import; passage/vocabulary CRUD; `/analytics`; dashboards | works (no regression) |

Plus: re-run Q1 and confirm the end-state policies match §3; re-run the Phase 16 suite + `next build` +
`eslint` green.

---

## 5. Deferred / out of scope

- **D1 FK remedy** (CASCADE → RESTRICT, or app-level pre-delete guard) — schema/behavior change, owner
  decision; not in Phase 17.
- **Automated cross-user RLS assertions in CI** (seeded test DB + Playwright) — **Phase 19** (mirrors the
  Phase 16 deferral). Phase 17 verifies the policies manually against the live project.
