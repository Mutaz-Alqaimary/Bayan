# Phase 17 — Security Review (RLS Tightening)

> **Status: Complete — RLS tightened and applied to the live DB; verified.** This spec was **rewritten against the current architecture**
> (post Phases 1→16, including the Phase 12.5 identity model, the Phase 12.6 role/profile + storage
> hardening, Phase 13 Reading Analytics' "session-client + permissive RLS" design, Phase 14
> Performance, the Phase 15 Accessibility audit, and the Phase 16 Vitest suite). It **supersedes the
> original seven-bullet draft**, which was authored before any code existed and listed as "to review"
> several controls that **were already built and hardened in Phase 12.6** (avatar type/size validation,
> service-role-key containment, profile self-escalation, storage policies) and Zod re-validation that
> **Phase 16 already proves with tests**. For how the system works today, the single source of truth is
> [`docs/project/current-architecture.md`](../project/current-architecture.md); the live authorization
> contract lives in
> [`docs/database/manual-supabase-configuration.md`](../database/manual-supabase-configuration.md).
>
> **Companion doc (evidence):** [`docs/Security.md`](../Security.md) is created in this phase and is the
> **living findings register** — every reviewed surface, its verdict, and (for each tightened policy)
> the before/after and residual risk. Same one-home-per-fact split as `docs/Performance.md` (Phase 14),
> `docs/Accessibility.md` (Phase 15), and `docs/Testing.md` (Phase 16): this file holds the **plan and
> decision log**; `Security.md` holds the **findings map and the verification matrix**.

---

## Corrected project state (read before planning anything)

The roadmap banners in `00-index.md`, `CLAUDE.md`, and `current-architecture.md` still say *"Phases
1→13 complete, Phase 14 next."* That is **stale**: Phases **14 (Performance), 15 (Accessibility), and
16 (Testing) are implemented** (awaiting the owner's manual testing). **Phase 17 is genuinely next.**
Syncing those three banners is a documentation task **inside this phase** (Workstream 6), because the
Security Review is the natural checkpoint to true-up the project-state docs.

---

## Guiding principle

A Security Review's job is to make the **data layer enforce the permission matrix on its own**, so a
bug, a forged request, or a direct PostgREST call cannot do what the UI forbids. Bayan today authorizes
**twice in app code** (UI hide + `requireRole` at the action) and **scopes every student-facing read in
TypeScript** — but its **RLS is deliberately permissive** (`using(true)` on `students`,
`reading_sessions`, `reading_passages`, `vocabulary_terms`), a debt **explicitly deferred to this
phase** (`current-architecture.md` §4, §16; `manual-supabase-configuration.md` §3). The single
highest-leverage thing Phase 17 does is **close that gap with least-privilege, role-aware RLS** so the
database is a real second line of defense — not re-implement controls that already exist.

Everything else in the review is **confirm-and-document**, not rebuild: the controls the original draft
listed (service-role-key containment, Zod re-validation, avatar upload validation, profile
self-escalation, storage policies) were **built and hardened in Phase 12.6** and several are **proven by
the Phase 16 tests**. Phase 17 verifies them against the live system and records the verdict in
`Security.md`; it does not redo them.

---

## Source-of-truth & evidence policy (read before any conclusion)

**`supabase/setup.sql` is NOT authoritative for Phase 17.** It has drifted over time and is only a
**historical/bootstrap reference** — it is *known* to misrepresent the live DB (e.g. it still shows the
pre-12.6 broad `profiles_update_own`, which `manual-supabase-configuration.md` §3a says was redesigned
live). **No security finding, assumption, or policy-name in this phase may rest on `setup.sql`.** The
primary references are, in order: the **live database** (only via SQL the owner runs — this environment
has **no Supabase access**), the **current implementation** (`features/**`, `lib/**`), and the
**architecture docs** (`current-architecture.md`, `manual-supabase-configuration.md`).

Because the live DB can't be inspected from here, **every authorization claim is tagged**:

- **Verified** — confirmed by output the owner pasted from a read-only query (or by reading the code).
- **Inferred** — derived from the codebase + architecture docs, consistent but not confirmed against the
  live policy text.
- **Unknown** — requires the owner to run a query before any policy is rewritten against it.

`Security.md` carries this tag on every finding; nothing moves from Inferred/Unknown → Verified without
owner-supplied evidence. **Workstream 0 is the read-only live audit that produces that evidence**, and
it gates all rewriting.

### What we currently believe (and its tag)

| Claim | Tag | Basis |
|---|---|---|
| `profiles` SELECT = own row; UPDATE = column-scoped own row (12.6) | **Inferred** | code paths + `manual-supabase-configuration.md` §3, §3a (not yet re-confirmed live) |
| `user_settings` SELECT/INSERT/UPDATE = own row | **Inferred** | `manual-supabase-configuration.md` §3 + registration/settings code |
| `students` SELECT is permissive (`using(true)`/all-authenticated) | **Inferred** | `manual-supabase-configuration.md` §3 ("any authenticated `true`") + roster reads via session client |
| `reading_sessions` SELECT + INSERT are permissive | **Inferred** | `manual-supabase-configuration.md` §3 + analytics/history/insert via session client |
| `reading_passages` / `vocabulary_terms` SELECT permissive; **writes** permitted to a student via the session client | **Unknown** | code writes via session client (`features/reading/actions.ts`), but no write policy is documented anywhere authoritative — predicate could be staff-scoped, permissive, or absent |
| `students` INSERT/UPDATE/DELETE predicate (who can write the roster directly) | **Unknown** | `manual-supabase-configuration.md` §3 says "privileged writes via service-role," yet `students/actions.ts` create/update/delete run on the **session client** — the actual live write predicate is unconfirmed and is the crux of F4 |
| `service_role` has SELECT/INSERT/UPDATE on `public.students` | **Inferred** | `manual-supabase-configuration.md` §2 records a prior verification; re-confirm in Workstream 0 |

> The contradiction in the last two rows is the central reason Workstream 0 must run **first**: the docs
> say roster writes are service-role-only, but the code writes the roster on the RLS-bound session
> client — so *some* permissive `students` write policy almost certainly exists live, and its exact
> predicate determines what F4 actually is. We will **not** guess it from `setup.sql`.

---

## Workstream 0 — Read-only live audit (run this first)

The owner runs the following **read-only** SQL in the Supabase SQL editor and pastes the results back;
this is the evidence that moves the Inferred/Unknown rows above to Verified and fixes the exact
`drop policy if exists` names the tightening targets. **Nothing is rewritten before this returns.**

```sql
-- ============================================================================
-- PHASE 17 · WORKSTREAM 0 — READ-ONLY LIVE SECURITY AUDIT
-- 100% read-only: catalog SELECTs only. No DDL/DML. Safe to run on production.
-- Run each block; paste every result back. This output is the Verified baseline.
-- ============================================================================

-- Q1. Every RLS policy on the six app tables (full predicates + roles + cmd).
select schemaname, tablename, policyname, permissive, roles, cmd,
       qual       as using_expr,
       with_check as check_expr
from   pg_policies
where  schemaname = 'public'
  and  tablename in ('profiles','students','reading_passages',
                     'reading_sessions','vocabulary_terms','user_settings')
order  by tablename, cmd, policyname;

-- Q2. Is RLS enabled (and FORCEd) on each app table?
select c.relname as table_name,
       c.relrowsecurity   as rls_enabled,
       c.relforcerowsecurity as rls_forced
from   pg_class c
where  c.relnamespace = 'public'::regnamespace
  and  c.relname in ('profiles','students','reading_passages',
                     'reading_sessions','vocabulary_terms','user_settings')
order  by c.relname;

-- Q3. Table-level grants for the client-reachable roles (who can read/write each table).
select table_name, grantee, privilege_type, is_grantable
from   information_schema.role_table_grants
where  table_schema = 'public'
  and  table_name in ('profiles','students','reading_passages',
                      'reading_sessions','vocabulary_terms','user_settings')
  and  grantee in ('anon','authenticated','service_role')
order  by table_name, grantee, privilege_type;

-- Q4. COLUMN grants on profiles (proves the 12.6 column-scoped UPDATE hardening).
select table_name, column_name, grantee, privilege_type
from   information_schema.column_privileges
where  table_schema = 'public' and table_name = 'profiles'
  and  grantee in ('anon','authenticated')
order  by column_name, grantee, privilege_type;

-- Q5. Existing functions in public (name collisions + SECURITY DEFINER + search_path).
select p.proname as fn,
       pg_get_function_identity_arguments(p.oid) as args,
       p.prosecdef as security_definer,
       p.proconfig as config,            -- shows a pinned search_path if any
       l.lanname   as language
from   pg_proc p
join   pg_namespace n on n.oid = p.pronamespace
join   pg_language  l on l.oid = p.prolang
where  n.nspname = 'public'
order  by p.proname;

-- Q6. EXECUTE grants on those functions (who may call them).
select p.proname as fn,
       pg_get_function_identity_arguments(p.oid) as args,
       coalesce(pg_catalog.array_to_string(p.proacl, E'\n'), '(default: PUBLIC)') as execute_acl
from   pg_proc p
join   pg_namespace n on n.oid = p.pronamespace
where  n.nspname = 'public'
order  by p.proname;

-- Q7. storage.objects RLS policies (the four avatar policies — incl. avatars_public_read).
select policyname, permissive, roles, cmd,
       qual       as using_expr,
       with_check as check_expr
from   pg_policies
where  schemaname = 'storage' and tablename = 'objects'
order  by cmd, policyname;

-- Q8. Is RLS enabled on storage.objects?
select c.relname as table_name,
       c.relrowsecurity as rls_enabled,
       c.relforcerowsecurity as rls_forced
from   pg_class c
where  c.relnamespace = 'storage'::regnamespace
  and  c.relname = 'objects';

-- Q9. The avatars bucket configuration (Public flag + size + MIME allow-list).
select id, name, public, file_size_limit, allowed_mime_types, created_at, updated_at
from   storage.buckets
where  id = 'avatars';

-- Q10. Sanity cross-check — ANY policy anywhere in public/storage we didn't list above
--       (catches surprises: extra tables, renamed policies, forgotten objects).
select schemaname, tablename, policyname, cmd, roles
from   pg_policies
where  schemaname in ('public','storage')
order  by schemaname, tablename, cmd, policyname;

-- Q11. FK ON DELETE semantics on the identity/history links (confirms manual-config §5;
--       read-only context for how deletes cascade vs. set null — informs RLS reasoning).
select con.conname as constraint_name,
       rel.relname as table_name,
       confrel.relname as references_table,
       case con.confdeltype
         when 'a' then 'NO ACTION' when 'r' then 'RESTRICT'
         when 'c' then 'CASCADE'   when 'n' then 'SET NULL'
         when 'd' then 'SET DEFAULT' end as on_delete
from   pg_constraint con
join   pg_class rel     on rel.oid = con.conrelid
join   pg_class confrel on confrel.oid = con.confrelid
where  con.contype = 'f'
  and  rel.relnamespace = 'public'::regnamespace
  and  rel.relname in ('students','reading_sessions','profiles','user_settings','vocabulary_terms')
order  by rel.relname, con.conname;
```

All eleven blocks are **read-only** (catalog `SELECT`s only — no DDL/DML). The pasted output becomes the
**Verified baseline** recorded in `Security.md`; the tightening SQL (Workstream 1) is authored and diffed
against it, never against `setup.sql`.

---

## Scope guardrails

- **RLS / grants are authorization config, not schema.** Tightening policies and adding two
  `SECURITY DEFINER` helper functions is **in scope and not a "schema change"** — no table, column,
  relationship, or `setup.sql` table definition is touched. This follows the **exact precedent of Phase
  12.6**, which changed RLS, column grants, and `storage.objects` policies, applied them to the **live
  DB**, and recorded them in `manual-supabase-configuration.md` (not `setup.sql`). The two new functions
  are the same category as the existing `handle_updated_at()` function — plumbing, owner-approved during
  planning.
- **No table / column / relationship / migration changes.** Frozen, as in every phase since 12.5. If a
  finding *seems* to need one, stop and flag it.
- **No app behavior change.** The chosen strategy is **role-aware RLS with zero application-code edits**
  (see Technical Decisions): every existing session-client read/write keeps working, now backed by
  real least privilege. The review **adds defense-in-depth, it does not move data paths around.**
- **The owner applies the SQL.** This environment has **no access to the Supabase project**, so the
  deliverable is reviewed, **idempotent** SQL the owner runs in the SQL editor, plus verification
  queries and a smoke checklist — the same hand-off shape Phase 12.6 used.
- **Live verification is manual here; automated RLS E2E → Phase 19.** Phase 16 deferred *"whether a
  policy actually blocks a cross-user write"* to Phase 17 (live) + Phase 19 (CI). Phase 17 does the
  **manual live verification** against the real project; standing up a seeded test DB + Playwright RLS
  assertions in CI stays in **Phase 19**.
- **No Phase 18 / 19 / 20 work.** No reporting, deployment, or refactor.

---

## Findings (inferred from code + docs — confirm against the Workstream 0 audit)

Severity reflects impact **if RLS is the only thing standing** (a forged request / direct PostgREST
call), since app code currently scopes correctly through the UI. **Tag** is the evidence policy above —
none of these rests on `setup.sql`. No tightening is authored for a finding until its tag is **Verified**
by the Workstream 0 output.

| # | Severity | Tag | Surface | Believed-current behavior | Risk |
|---|---|---|---|---|---|
| F1 | **Critical** | Inferred | `students` SELECT permissive | Any authenticated user — **including any student** — can read the **entire roster**: names, emails, birth dates, and **`student_number`, the claim secret**. | PII disclosure **and** identity risk: enumerating all `student_number`s + the `profile_id IS NULL`-only claim guard lets a student claim other students' unlinked rows. |
| F2 | **High** | Inferred | `reading_sessions` SELECT permissive | Any student can read **every other student's** reading history. | Cross-student disclosure of performance records. |
| F3 | **High** | Inferred | `reading_sessions` INSERT permissive | Any authenticated user can **insert sessions for any `student_id`**. | Forged sessions pollute the product's core metric (WPM/accuracy), dashboards, and analytics. |
| F4 | **High** | **Unknown** | `students` INSERT / UPDATE / DELETE predicate | Roster writes run on the **session client** (`students/actions.ts`), so *some* policy permits them; the docs claim "service-role only" — contradiction. The live predicate decides whether *any* authenticated user can write the roster. | Roster tampering / integrity loss bypassing `requireRole` **if** the predicate is permissive. |
| F5 | **High** | **Unknown** | `reading_passages` & `vocabulary_terms` writes | Content CRUD runs on the **session client** (`reading/actions.ts`), so a write policy exists, but its predicate is undocumented. | If permissive, any authenticated **student** could create/edit/delete reading content & vocabulary, bypassing `canManageContent`. |
| F6 | Confirm | Inferred | `profiles` SELECT own-only; UPDATE column-scoped (12.6) | Believed already tight (§3a). | Verify the live policy matches §3a; no change expected. |
| F7 | Confirm | Inferred | `user_settings` own-row SELECT/INSERT/UPDATE | Believed already tight. | Verify; no change expected. |
| F8 | Confirm (already done) | Verified (code) / Inferred (live) | Service-role key, avatar type/size, storage policies, Zod re-validation, route guards | Hardened in 12.5/12.6; service-role containment + Zod/authz **Verified in code** and proven by Phase 16 tests; storage/bucket state Inferred until §5 of the audit returns. | Re-verify and record verdict in `Security.md`; **do not rebuild.** |

> **Note on F1–F3:** tagged **Inferred** (not Verified) because the *permissive* nature is documented in
> `manual-supabase-configuration.md` §3 and consistent with every session-client read, but the exact live
> policy text is only confirmed by Workstream 0. The redesign target is the same regardless of the
> current predicate's wording, but the `drop policy if exists` names come from the audit.

---

## The tightening design (role-aware least privilege)

### Why role-aware, not "own-row only"

Many **admin/teacher** surfaces read/write `students` and `reading_sessions` through the
**RLS-respecting session client**, so a naive student-scoped policy would break them. The policies must
encode **`is_staff() OR owns-the-row`**:

- **Would break under own-row-only** (must stay allowed for staff): `students/queries.ts` (roster list),
  `students/actions.ts` (create/update/delete), `students/import-export/actions.ts` (bulk upsert),
  `analytics/reading/queries.ts`, `dashboard/data/admin.ts` + `teacher.ts`, `reading/actions.ts`
  (content CRUD).
- **Must stay allowed as own-scope** (student, session client): `reading/sessions/queries.ts` (own
  history), `dashboard/data/student.ts` (own stats), `reading/sessions/actions.ts` (insert own session).
- **Unaffected** (service-role bypasses RLS): `teachers/*`, `students/identity/*` (claim / activation /
  reconcile — incl. the student self-claim UPDATE, which uses the **admin** client), registration, the
  email change.

### Two `SECURITY DEFINER` helpers (avoid recursive RLS)

```sql
-- "Is the current user admin or teacher?" Reads profiles bypassing RLS (SECURITY DEFINER)
-- so a policy ON another table can call it without recursing into profiles' own RLS.
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'teacher')
  );
$$;

-- "Does the current user own this students row (via the Phase 12.5 profile_id link)?"
create or replace function public.is_my_student(sid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.students
    where id = sid and profile_id = auth.uid()
  );
$$;

revoke execute on function public.is_staff()            from public, anon;
revoke execute on function public.is_my_student(uuid)   from public, anon;
grant  execute on function public.is_staff()            to authenticated;
grant  execute on function public.is_my_student(uuid)   to authenticated;
```

> `SECURITY DEFINER` + `set search_path = public` is the standard Supabase pattern for role checks
> inside policies; pinning `search_path` is the required hardening so the function can't be hijacked by
> a caller-controlled path.

### Target policies (idempotent; owner applies)

The exact `drop policy if exists` + `create policy` set is finalized **against the live dump** (Workstream
0). The intended end-state:

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `students` | `is_staff() OR profile_id = auth.uid()` | `is_staff()` | `is_staff()` | `is_staff()` |
| `reading_sessions` | `is_staff() OR is_my_student(student_id)` | `with check (is_my_student(student_id))` | *(none — app never updates; RLS denies)* | *(none — app never deletes; cascades only)* |
| `reading_passages` | `authenticated using(true)` **(keep — all roles read content)** | `is_staff()` | `is_staff()` | `is_staff()` |
| `vocabulary_terms` | `authenticated using(true)` **(keep)** | `is_staff()` | `is_staff()` | `is_staff()` |
| `profiles` | own row **(no change — verify)** | none **(service-role)** | column-scoped own row **(no change — verify §3a)** | none |
| `user_settings` | own row **(no change — verify)** | own row **(no change)** | own row **(no change)** | none |

Notes:
- **Student self-claim is unaffected:** it updates `students.profile_id` via the **admin** client
  (service-role bypasses RLS), so `students` UPDATE staying staff-only does **not** block it
  (`current-architecture.md` §9).
- **`reading_sessions` has no UPDATE/DELETE path in app code** — leaving those policy-less means RLS
  denies them by default, which is itself a tightening (the cascade on `students` delete is unaffected).
- **Any misleadingly-named permissive `reading_sessions` SELECT policy** (the Workstream 0 audit returns
  the real name + predicate) is replaced by the real own-scope policy above.

---

## Workstreams

### Workstream 0 — Read-only live audit (must come first)

- The owner runs the five read-only queries in **"Workstream 0 — Read-only live audit"** above (this
  environment has no Supabase access) and pastes the output back.
- Record the output as the **Verified baseline** in `Security.md`, tagged per the evidence policy. This
  converts the **Unknown** rows (F4 roster-write predicate, F5 content-write predicate) and the
  **Inferred** rows (F1–F3, F6–F7) to **Verified**, and fixes the exact `drop policy if exists` names the
  tightening must target. **`setup.sql` is not consulted for this** — the live output is the only
  baseline.

### Workstream 1 — Author the tightening SQL (idempotent, owner-applied)

- `supabase/fixes/phase-17-rls-tightening.sql` — the canonical, **idempotent** apply script: the two
  helpers (with `revoke`/`grant`), then per-table `drop policy if exists` (using the **real names from
  the Workstream 0 audit**) + `create policy` for `students`, `reading_sessions`, `reading_passages`,
  `vocabulary_terms`. (Additive new file — mirrors the existing
  `supabase/fixes/phase-10-database-alignment.sql` precedent; **`setup.sql` is left untouched** per the
  locked-SQL rule, and is *not* refreshed — it is a non-authoritative historical artifact, so editing it
  to "match" would imply a fidelity it no longer has. The live DB + `manual-supabase-configuration.md`
  are the maintained record.)
- No app code changes (role-aware strategy). If the audit reveals a session-client path the matrix
  missed, **fix the policy to permit it**, not the app — and record why.

### Workstream 2 — Verify the already-built controls (confirm, don't rebuild)

Re-verify and record the verdict in `Security.md`, citing existing evidence rather than re-implementing:

- **Service-role key containment** — grep confirms `SUPABASE_SERVICE_ROLE_KEY` is read only in
  `lib/supabase/admin.ts` behind `import "server-only"`, never via `lib/supabase/env.ts`; no
  client-importable module references it. Confirm `next build` produces no client bundle containing it.
- **Authorization enforced server-side** — every mutation calls `requireRole(...)` and re-validates with
  the **same Zod schema the client used** (`current-architecture.md` §14). **Phase 16 already proves**
  the capability matrix (one table-driven test) and every `canChangeRole` rule. Cite those tests as
  evidence; spot-check that each action in the §14 inventory still gates correctly.
- **Route protection** — `requireUser` / `requireRole` / `redirectIfAuthenticated` cover every protected
  page; the `proxy.ts` matcher excludes only `api`/`_next`/static. Confirm no protected route renders
  data before its guard.
- **File upload security** — `validateWebpUpload` (type=webp + ≤1 MB) + bucket `file_size_limit` 1 MB +
  MIME allow-list + the four owner-scoped `storage.objects` policies (Phase 12.6 §6/§6a). Re-verify the
  bucket settings and that `avatars_public_read` remains (load-bearing for upsert — §6a).
- **Environment-variable safety** — only `NEXT_PUBLIC_*` reach the client; `SUPABASE_SERVICE_ROLE_KEY`
  and `NEXT_PUBLIC_SITE_URL` usage reviewed; `.env*` is git-ignored and not committed.

### Workstream 3 — Live verification (manual, against the real project)

- After the owner applies Workstream 1, run the **verification matrix** (`Security.md`): as a **student**
  account, attempt a direct session-client read of another student's `students` row and
  `reading_sessions` (expect 0 rows), and an insert of a session for a foreign `student_id` (expect
  denied); as **teacher/admin**, confirm roster list, import, content CRUD, analytics, and dashboards all
  still return full data. Re-dump `pg_policies` to confirm the end-state matches the target table.
- **Smoke checklist** (owner's manual pass) — the surfaces from the breakage map: student reading
  history + complete-a-session; teacher/admin roster CRUD + CSV import; passage/vocabulary CRUD;
  `/analytics` cohort + student drill-down; all three dashboards.
- Automated cross-user RLS assertions (seeded test DB + Playwright) are **out of scope → Phase 19**;
  record the hand-off so it isn't lost (the mirror of Phase 16's deferral note).

### Workstream 4 — Documentation

- Create [`docs/Security.md`](../Security.md): the verified live baseline (Workstream 0), the findings
  register (F1–F8 with before/after policy + residual risk), the role-aware policy model + the two
  helpers, the verification matrix + smoke checklist, the "already-hardened in 12.5/12.6 + proven by
  Phase 16" confirmations, and the explicit **Phase 19 hand-off** (automated RLS E2E).
- Update [`manual-supabase-configuration.md`](../database/manual-supabase-configuration.md): §3 RLS
  table permissive → tightened; new **§3b** (the helpers + the new policies); refresh the reproduction
  checklist (step 5 now reproduces the tightened policies + the two functions).
- Update [`current-architecture.md`](../project/current-architecture.md): §4 RLS table → tightened;
  remove the "to be tightened in Phase 17" notes in §4 and §16; bump "Last synchronized" to Phase 17.
- Sync the **stale project-state banners**: `docs/phases/00-index.md` (mark 14/15/16 done, 17 in
  progress) and the `CLAUDE.md` / `current-architecture.md` "current state" lines.

**Order:** 0 → 1 → 2 → 3 → 4. Workstream 0 gates everything (the dump defines the real `drop policy`
names); 1 is authored from it; 2 runs in parallel with 1; 3 needs the owner to apply 1; docs finalize
last on `/finish-phase`.

---

## Technical decisions

1. **Role-aware RLS with zero app-code changes** *(owner-confirmed during planning)*. Encode
   `is_staff() OR owns-row` in the policies so every existing session-client path keeps working — rather
   than moving privileged writes to the service-role client (which would be a larger refactor **and**
   weaken defense-in-depth, since service-role bypasses all RLS). This is the most consistent with the
   Phase 13 decision to run analytics on the session client over permissive RLS — Phase 17 simply makes
   that RLS least-privilege.
2. **Two `SECURITY DEFINER` helpers (`is_staff`, `is_my_student`)** *(owner-confirmed)*. Treated as
   authorization plumbing like the existing `handle_updated_at()` — not a schema change. `SECURITY
   DEFINER` + pinned `search_path` is the standard, recursion-safe way to read `profiles.role` inside a
   policy on another table; `execute` is granted to `authenticated` only.
3. **The live DB is the only baseline; `setup.sql` is a non-authoritative historical artifact**
   *(owner-directed)*. `setup.sql` has drifted (it predates the 12.6 `profiles` redesign) and may not
   represent live security configuration, so **no finding, assumption, or policy name rests on it**.
   Every authorization claim is tagged Verified / Inferred / Unknown; Workstream 0's read-only audit
   produces the Verified baseline before any change, and the apply script's `drop policy if exists` uses
   the **real names that audit returns**.
4. **Additive apply file, `setup.sql` untouched and not "refreshed."** Ship
   `supabase/fixes/phase-17-rls-tightening.sql` (precedent:
   `supabase/fixes/phase-10-database-alignment.sql`). `setup.sql` is **not** edited to "match" — doing so
   would imply a fidelity it no longer has; the live DB + `manual-supabase-configuration.md` are the
   maintained record.
5. **Confirm-don't-rebuild for the 12.6 controls.** Avatars, storage policies, service-role containment,
   Zod re-validation, profile self-escalation are already hardened and (for authz/Zod) **tested in Phase
   16**; Phase 17 records the verdict and cites the evidence rather than redoing the work.
6. **Manual live verification now; automated RLS E2E → Phase 19.** Phase 17 proves the policies against
   the real project by hand (the Phase 16 deferral target); CI-driven cross-user RLS tests need the
   seeded test DB that only exists at Deployment.

---

## Constraints

- **No table / column / relationship / migration changes**; `setup.sql` table definitions untouched.
- **RLS policies + grants + two `SECURITY DEFINER` helper functions only** — applied to the live DB by
  the owner, documented in `manual-supabase-configuration.md` (not `setup.sql`).
- **No application-code changes** under the chosen role-aware strategy (a policy fix, not a code fix, if
  the breakage map missed a path).
- **No runtime/product dependency changes.**
- **`next build`, `eslint`, and `npm run test` (the Phase 16 suite) stay green.**
- **No Phase 18 / 19 / 20 work**; automated RLS E2E is explicitly handed to Phase 19.

---

## Risks

| Risk | Handling |
|---|---|
| A tightened policy breaks a session-client surface the breakage map missed. | Workstream 0's live dump + the explicit allowed/denied surface map; verify with the smoke checklist before/after; fix the **policy** (not the app) and record why. |
| Acting on a stale source — `setup.sql` (non-authoritative) or an Inferred assumption — and targeting the wrong policy names or mischaracterizing a finding. | Evidence policy: every claim is tagged Verified/Inferred/Unknown; nothing is rewritten until Workstream 0's read-only audit makes it **Verified**; the apply script uses `drop policy if exists` against the real audited names. |
| Recursive RLS when a policy on one table reads `profiles`/`students`. | `SECURITY DEFINER` helpers bypass the inner table's RLS; `search_path` pinned to `public`. |
| Owner applies the SQL to production without a dry run. | Ship idempotent SQL + the read-only verification dump; recommend applying on a branch/staging or during a quiet window; every statement is reversible (re-create the prior policy). |
| Review re-implements already-built 12.6 controls (scope creep). | Findings F6–F8 are **confirm-and-document**, citing Phase 16 tests / 12.6 docs as evidence — not rebuild. |
| Scope bleed into automated E2E / RLS-in-CI. | Hold the Phase 19 boundary; record the hand-off in `Security.md`. |
| `student_number` claim-secret exposure understated. | F1 is flagged **Critical** and verified explicitly in the matrix (a student must not be able to read another student's `student_number`). |

---

## Dependencies

- **Upstream:** Phases 1→16 complete. Relies on the Phase 12.5 identity link (`profile_id`, used by
  `is_my_student`), the Phase 12.6 `profiles`/storage hardening (already live — only re-verified here),
  the Phase 13 "session-client + RLS" analytics design (the reason policies must be role-aware), and the
  Phase 16 authorization/Zod tests (cited as evidence). **Requires the owner to run SQL on the live
  project** (no Supabase access in this environment).
- **Downstream:** Phase 19 (Deployment) stands up the seeded test DB + Playwright and wires **automated
  cross-user RLS assertions** into CI, picking up this phase's hand-off; Phase 18 (Reporting) and Phase
  20 (Refactor) inherit a hardened data layer and **reference `Security.md`** rather than re-deriving the
  policy model.

---

## Definition of Done

- **Live `pg_policies` + grants dumped** (Workstream 0's read-only audit) and recorded in `Security.md`
  as the **Verified baseline**; every Inferred/Unknown finding is resolved to Verified before any change.
  **`setup.sql` is not used as a baseline.**
- **The permissive policies are replaced with role-aware least privilege** — `students` (F1, F4),
  `reading_sessions` (F2, F3), and the content tables' writes (F5, once the audit confirms the predicate)
  — via the `supabase/fixes/phase-17-rls-tightening.sql` apply script (idempotent), applied by the owner.
- **`public.is_staff()` and `public.is_my_student(uuid)` exist**, are `SECURITY DEFINER` with pinned
  `search_path`, and `execute` is granted to `authenticated` only.
- **Verified live, as a student:** cannot read another student's `students` row (incl.
  `student_number`) or `reading_sessions`, and cannot insert a session for a foreign `student_id`.
- **Verified live, as teacher/admin:** roster list + CRUD, CSV import, passage/vocabulary CRUD,
  `/analytics`, and all dashboards still return full data (no regression).
- **The already-built controls are re-verified and recorded** in `Security.md` — service-role-key
  containment, server-side authz + Zod re-validation (citing Phase 16 tests), route protection, avatar
  type/size + storage policies, env-var safety — **without rebuilding them.**
- **`docs/Security.md` created**; `manual-supabase-configuration.md` (§3 + new §3b + checklist),
  `current-architecture.md` (§4/§16 + sync banner), and `00-index.md` / `CLAUDE.md` state banners
  updated.
- **No schema / table / column / migration change**; **no app-code change**; `next build` + `eslint` +
  `npm run test` stay green; **no Phase 18/19/20 work** (automated RLS E2E handed to Phase 19).

---

## Decision Log

> Append-only record of significant security decisions made *while planning/implementing* Phase 17 —
> kept so a future session understands not just *what* was tightened but *why* something was tightened,
> deferred, or declined, without re-deriving it. **`docs/Security.md` holds the findings map and
> verification matrix (the data); this log holds the reasoning.**

### Entries

#### 2026-06-30 — Spec rewritten against current architecture (planning)

- Decision: assumption-change (owner-prompted full re-plan against the implemented project).
- Context: The original seven-bullet draft predated the code and listed as "to review" several controls
  **already built and hardened in Phase 12.6** (avatar type/size, service-role-key containment, profile
  self-escalation, storage policies) and Zod re-validation that **Phase 16 already proves with tests**.
  It also predated the Phase 13 "session-client + permissive RLS" analytics design that constrains how
  RLS can be tightened.
- Reasoning: A review pass should add the missing control (least-privilege RLS) and **confirm** the
  existing ones, not re-implement what's done. The client-usage map + the architecture docs surfaced the
  real, deferred gap (permissive SELECT/INSERT on `students`/`reading_sessions`, incl. the
  `student_number` claim-secret exposure) and an unconfirmed roster/content write predicate.
- Outcome: Phase scoped to (0) read-only live audit, (1) role-aware RLS tightening, (2)
  confirm-don't-rebuild the 12.6/16 controls, (3) manual live verification, (4) docs — with automated
  RLS E2E handed to Phase 19.

#### 2026-06-30 — `setup.sql` is non-authoritative; evidence must be tagged (owner-directed)

- Decision: assumption-change (owner clarification).
- Context: The first rewrite of this spec cited `supabase/setup.sql` as evidence for several findings and
  framed Workstream 0 as "reconcile the dump against `setup.sql`." The owner clarified that `setup.sql`
  has drifted and is **only a historical/bootstrap reference** — it must not back any Phase 17
  conclusion — and that this environment cannot inspect the live DB.
- Reasoning: Authorization behavior can only be confirmed from the live database, which is owner-gated.
  Conclusions drawn from a stale SQL file risk targeting non-existent policy names or mischaracterizing a
  finding's severity (e.g. F4's roster-write predicate, which the docs and the code already disagree on).
- Outcome: Added the **Source-of-truth & evidence policy** (every claim tagged Verified / Inferred /
  Unknown), demoted `setup.sql` to a non-authoritative artifact (no finding rests on it; it is not
  edited/refreshed), re-tagged the findings table (F1–F3 Inferred, F4–F5 Unknown, F6–F7 Inferred, F8
  Verified-in-code), and replaced the old Workstream 0 with a concrete **read-only audit SQL** the owner
  runs to produce the Verified baseline. No rewriting happens before that audit returns.

#### 2026-06-30 — Strategy = role-aware RLS + two SECURITY DEFINER helpers (owner-confirmed)

- Decision: accepted (both, owner-confirmed during planning).
- Context: Many admin/teacher surfaces read/write `students` and `reading_sessions` via the session
  client, so an own-row-only policy would break the roster list, import, content CRUD, analytics, and
  dashboards. Two encodings of "is this user staff" were on the table.
- Reasoning: Role-aware policies (`is_staff() OR owns-row`) keep every existing data path working with
  **zero app-code changes** and give true DB-level least privilege — more consistent with Phase 13 than
  moving privileged writes to the service-role client (a larger refactor that also weakens
  defense-in-depth). A `SECURITY DEFINER is_staff()` (+ `is_my_student(uuid)`), `search_path`-pinned and
  `execute`-granted to `authenticated` only, is the recursion-safe standard pattern and the same
  category as the existing `handle_updated_at()` function — accepted as authorization plumbing, not a
  schema change.
- Outcome: Target policy table fixed; `supabase/fixes/phase-17-rls-tightening.sql` is the additive,
  idempotent apply artifact. (Superseded in part by the later "`setup.sql` is non-authoritative" entry:
  `setup.sql` is **not** refreshed — the live DB + `manual-supabase-configuration.md` are the record.)
