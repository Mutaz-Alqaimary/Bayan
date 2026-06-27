# Manual Supabase Configuration (reproduce the live project)

> **Purpose.** This file records every Supabase configuration that exists **outside `setup.sql`** —
> dashboard settings, auth provider settings, privileges, RLS assumptions, triggers (and their
> deliberate absence), and environment variables. The goal: another developer can reproduce Bayan's
> backend configuration from this file alone.
>
> **Database rule (from `CLAUDE.md`):** the live Supabase database is the **source of truth** for
> authorization behavior. Do not assume `setup.sql` contains all permissions or RLS policies. This
> file documents what is *actually* configured, including things `setup.sql` does not represent.
>
> The schema itself (tables/columns) is the locked contract in `.claude/rules/database-schema.md`.
> **Never** create tables, columns, migrations, or schema changes.

---

## 1. Auth provider settings (Authentication → dashboard)

| Setting | Value | Why it matters |
|---|---|---|
| **Email → Confirm email** | **OFF** | **Required.** Public registration uses `supabase.auth.signUp()`; with confirmation disabled the project auto-confirms the signup and returns a session immediately, so the user signs in in one step. With it ON, `signUp()` would not return a session and `signUpAction` would roll back (Bayan has no SMTP to deliver a confirmation). |
| **SMTP** | **Not configured** | Bayan is intentionally SMTP-free. No flow depends on an email being delivered. |
| **Redirect URLs (allow-list)** | Must include the app origin's `/api/auth/callback` | Password-reset and admin activation links redirect through `ROUTES.authCallback` (`/api/auth/callback?next=…`). The resulting URL must be in Supabase's redirect allow-list, or the link is rejected. Add each deployment origin (local dev + production). |

> **Consequence — emails are honestly unverified.** Because confirmation is off and no email is ever
> sent, possession of an email never proves anything. That is **by design**: roster claiming requires
> the school-issued `student_number` (a secret), and admin email changes are privileged — never an
> email round-trip. See `docs/project/current-architecture.md` §3, §9, §10.

---

## 2. Service-role privileges (`service_role`)

Phase 12.5's privileged server actions run through the **service-role admin client**
(`lib/supabase/admin.ts`), which performs direct reads/writes on `public.students`. `service_role`
bypasses RLS but **still needs table privileges**.

**Verified state (this project):** `service_role` already holds **SELECT, INSERT, UPDATE** on
`public.students`. No grant needs to be run. Re-confirm at any time:

```sql
select privilege_type
from information_schema.role_table_grants
where grantee = 'service_role'
  and table_schema = 'public'
  and table_name = 'students'
order by privilege_type;
```

Expected (and present): `INSERT`, `SELECT`, `UPDATE`.

For a **fresh** deployment where the check shows a missing privilege, the equivalent grant would be
the following — **not needed and not to be run against this project**:

```sql
-- Reference only — already satisfied here; do not run against this project.
grant select, insert, update on public.students to service_role;
```

`auth.users` mutations (`createUser`, `updateUserById`, `deleteUser`, `generateLink`, `listUsers`) go
through the **GoTrue Admin API** authorized by the service-role key — they need **no table grant**.

See `docs/database/phase-12.5-identity-alignment.md` for the full operation-by-privilege breakdown.

---

## 3. RLS assumptions (current contract)

RLS is **enabled on every table**. The policies below are what the app relies on today. They are
**permissive on purpose** for now; tightening the `using(true)` policies is **Phase 17 (Security
Review)** scope.

| Table | SELECT policy | Write policy | App reliance |
|---|---|---|---|
| `profiles` | own row (`auth.uid() = id`) | **no INSERT policy** | Registration profile insert + cross-user reads use the service-role client (role-gated in app code). |
| `user_settings` | own row (`auth.uid() = user_id`) | own row insert/update (`settings_insert_own` + own-row update) | Registration inserts the row via the **session client** under `settings_insert_own`; Settings reads/writes own row only. |
| `students` | any authenticated (`true`) | privileged writes via service-role | Admin/teacher read all; **student reads scope to own `student_id` in-query** — never rely on RLS for student isolation. |
| `reading_passages` | any authenticated (`true`) | — | Readable by all roles. |
| `vocabulary_terms` | any authenticated (`true`) | — | Readable by all roles. |
| `reading_sessions` | any authenticated (`true`) | student inserts own | Scope per student in app code; never rely on RLS for isolation. |

> **Do not weaken these assumptions in code.** Because `students` / `reading_passages` /
> `reading_sessions` SELECT is permissive, **app code must do the scoping**. Student-facing reads
> resolve the student via `profile_id` (`getLinkedStudentId`) and filter by `student_id`.

---

## 4. Triggers (deliberately none on `auth.users`)

**There is no `on auth.users` signup trigger**, and nothing in the app relies on one. This is a
deliberate decision:

- `signUpAction` creates the `user_settings` row **explicitly** (via the session client, under
  `settings_insert_own`) and the `profiles` / `students` rows via the service-role client.
- Every account is therefore fully initialized (`auth.users` + `profiles` + `user_settings` +
  `students`) by **application code alone** — deterministic, debuggable, and not dependent on a
  database trigger that `setup.sql` may or may not represent.

If a trigger is ever added, it must not conflict with these explicit inserts (e.g. a settings-creating
trigger would collide with step 4 of registration).

---

## 5. Foreign-key `ON DELETE` semantics (already correct — do not change)

These existed before Phase 12.5 and the identity model depends on them:

- **`students.profile_id` → `profiles.id` : `ON DELETE SET NULL`.** Deleting a linked account leaves
  the academic record + reading history intact, with `profile_id` reset to `NULL` (a roster-only row
  again).
- **`reading_sessions.student_id` → `students.id` : `ON DELETE` restricts/cascades as the history
  anchor.** Deleting a student with sessions is **refused** by the app (`23503`) rather than
  destroying reading history.
- **`profiles.id` / `user_settings.user_id` → `auth.users.id` : cascade.** Deleting an auth user
  cascades its profile + settings (this is what registration rollback relies on).

---

## 6. Storage

Bucket: **`avatars`**. (Profile avatars; `profiles.avatar_url`.)

---

## 7. Environment variables

| Variable | Where read | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `lib/supabase/env.ts` | Public. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `lib/supabase/env.ts` | Public. |
| `SUPABASE_SERVICE_ROLE_KEY` | `lib/supabase/admin.ts` (server-only) | **Never** exported from a client-importable module. Service-role; bypasses RLS. |
| `NEXT_PUBLIC_SITE_URL` | auth + activation actions | Preferred origin for building redirect/activation links; falls back to the request `Origin`/forwarded host. Whatever it resolves to must be in the Supabase redirect allow-list (§1). |

---

## 8. Reproduction checklist (fresh environment)

1. Create the Supabase project and apply the schema (the locked tables in
   `.claude/rules/database-schema.md`).
2. **Authentication → Email → Confirm email = OFF.** Leave SMTP unconfigured.
3. Add each app origin's `/api/auth/callback` URL to the **redirect allow-list**.
4. Verify `service_role` has `SELECT, INSERT, UPDATE` on `public.students` (§2 query). Grant only if
   missing.
5. Confirm RLS is enabled on all tables with the policies in §3 (including `settings_insert_own` and
   the own-row `profiles`/`user_settings` SELECT policies).
6. Confirm the FK `ON DELETE` semantics in §5.
7. Create the `avatars` storage bucket.
8. Set the four environment variables (§7); keep the service-role key server-only.
9. Do **not** add an `on auth.users` trigger (§4).
