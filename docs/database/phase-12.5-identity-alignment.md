# Phase 12.5 — Database Alignment (verified — no changes required)

> **Status for this project:** ✅ **No database changes are required.** The privileges
> Phase 12.5 depends on were **verified already present** in the live project. There is
> nothing to run.

## What Phase 12.5 needs (and why)

Phase 12.5 introduces **no schema changes** — the `students.profile_id` bridge and all FK
`ON DELETE` semantics already exist. Its privileged, server-validated operations run through the
service-role admin client (`lib/supabase/admin.ts`), which performs direct table reads/writes on
`public.students`:

| Operation | Needs on `students` |
|---|---|
| Public self-registration | `INSERT` a row + `SELECT` by email |
| Secure roster claim | `SELECT` by student_number + `UPDATE` `profile_id` |
| Admin activation-link flow | `UPDATE` `profile_id` |
| Admin email change | `UPDATE` `email` |
| Account status / reconciliation | `SELECT` |

`service_role` bypasses RLS but still needs these **table privileges**. `auth.users` mutations go
through the GoTrue Admin API (authorized by the service-role key) and need no table grant.

## Verified state (this project)

`service_role` already holds **SELECT, INSERT, and UPDATE** on `public.students` (verified by the
project owner), so the privilege requirement is **already satisfied — no grant needs to be run.**

You can re-confirm at any time with this read-only query:

```sql
select privilege_type
from information_schema.role_table_grants
where grantee = 'service_role'
  and table_schema = 'public'
  and table_name = 'students'
order by privilege_type;
```

Expected (and present): `INSERT`, `SELECT`, `UPDATE`.

## Reference only (do NOT run for this project — already satisfied)

For a *fresh* deployment where the check above shows a missing privilege, the equivalent grant would
be the following. It is **not needed here** and should **not** be run against this project:

```sql
-- Reference only — already satisfied in this project; do not run.
grant select, insert, update on public.students to service_role;
```

## Also verify (no SQL — dashboard setting)

1. **Authentication → Providers → Email → "Confirm email" is OFF.** Public registration uses
   `supabase.auth.signUp()`; with confirmation **disabled** the project auto-confirms the signup and
   returns a session immediately (the user signs in in one step). This is a dashboard setting, not a
   code/schema change, and it is **required** for the public registration flow to work without SMTP.

> **No reliance on a signup trigger.** Phase 12.5 creates the `user_settings` row **explicitly** in
> `signUpAction` (via the session client, under the existing `settings_insert_own` RLS), and the
> `profiles`/`students` rows via the service-role client. Nothing depends on an `on auth.users`
> trigger — there is none — so every account is fully initialized
> (`auth.users` + `profiles` + `user_settings` + `students`) by application code alone.
