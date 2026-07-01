# Manual Supabase Configuration (reproduce the live project)

> **Purpose.** The canonical current-state SQL is [`supabase/schema.sql`](../../supabase/schema.sql)
> (tables, indexes, triggers, RLS policies, grants, helper functions). **This file records the config
> that is *not* expressible in SQL** — dashboard/auth-provider settings, the storage bucket, privilege
> rationale, trigger notes — plus the *why* behind the policies, so another developer can reproduce
> Bayan's backend from `schema.sql` + this file together.
>
> **Database rule (from `CLAUDE.md`):** the **live Supabase database** remains the ultimate source of
> truth for authorization behavior; `schema.sql` is its canonical representation (validate against a
> `supabase db dump` if in doubt).
>
> The schema itself (tables/columns) is the locked contract in `.claude/rules/database-schema.md`.
> **Never** create tables, columns, migrations, or schema changes.

---

## 1. Auth provider settings (Authentication → dashboard)

| Setting | Value | Why it matters |
|---|---|---|
| **Email → Confirm email** | **OFF** | **Required.** Public registration uses `supabase.auth.signUp()`; with confirmation disabled the project auto-confirms the signup and returns a session immediately, so the user signs in in one step. With it ON, `signUp()` would not return a session and `signUpAction` would roll back (Bayan has no SMTP to deliver a confirmation). |
| **SMTP** | **Not configured** | Bayan is intentionally SMTP-free. No flow depends on an email being delivered. |
| **Redirect URLs (allow-list)** | Must include the app origin's `/api/auth/callback` | Password-reset (PKCE `?code`) and admin activation links (token-hash `?token_hash=&type=recovery`) both route through `ROUTES.authCallback` (`/api/auth/callback`). The `generateLink` `redirectTo` we pass (the callback URL) must be in Supabase's redirect allow-list, or link generation is rejected. Add each deployment origin (local dev + production). The callback then verifies via `exchangeCodeForSession` (PKCE) or `verifyOtp({ token_hash })` (activation) — see `current-architecture.md` §8a. |

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

RLS is **enabled on every table**. Since **Phase 17 (Security Review)** the earlier permissive
`using(true)` policies on `students` / `reading_sessions` / `reading_passages` / `vocabulary_terms`
were **replaced with role-aware least-privilege policies** (see §3b for the helpers + migration). Table
grants are unchanged; the tightened RLS is now the gate. Current policies:

| Table | SELECT policy | Write policy | App reliance |
|---|---|---|---|
| `profiles` | own row (`auth.uid() = id`) | **no INSERT policy**; **UPDATE = own row, columns `full_name`/`avatar_url` only** (Phase 12.6 — see §3a) | Registration profile insert + all cross-user reads/`role` writes use the service-role client (role-gated). Self-service profile editing (name/avatar) uses the session client under the scoped policy. |
| `user_settings` | own row (`auth.uid() = user_id`) | own row insert/update (`settings_insert_own` + own-row update) | Registration inserts the row via the **session client** under `settings_insert_own`; Settings reads/writes own row only. |
| `students` | `is_staff() OR profile_id = auth.uid()` | INSERT/UPDATE/DELETE gated by `is_staff()` | Staff (admin/teacher) read + write the whole roster via the session client; a student sees only their own linked row. The self-claim writes `profile_id` via the **admin** client (bypasses RLS). |
| `reading_passages` | any authenticated (`true`) | INSERT/UPDATE/DELETE gated by `is_staff()` | All roles read content; only staff write it. |
| `vocabulary_terms` | any authenticated (`true`) | INSERT/UPDATE/DELETE gated by `is_staff()` | All roles read; only staff write. |
| `reading_sessions` | `is_staff() OR is_my_student(student_id)` | INSERT gated by `is_my_student(student_id)`; no UPDATE/DELETE policy | Staff read all (analytics/dashboards); a student reads + inserts only their own sessions. |

> **Defense in depth, not a substitute for app scoping.** App code still resolves the student via
> `profile_id` (`getLinkedStudentId`) and filters by `student_id`; the tightened RLS now independently
> enforces the same boundaries so a forged/direct request cannot cross them.

### 3a. Profiles self-edit hardening (Phase 12.6 — APPLIED)

Profile Editing (Phase 12.6, Part 1) lets a user edit **only** their own `full_name` and
`avatar_url`. The previously over-broad `profiles_update_own` policy (`USING (auth.uid()=id)`, no
`WITH CHECK`, no column scope) allowed self-escalation of `role`. It was **redesigned** (not removed)
with two layers — **applied to the live project**:

```sql
-- Layer 1 — COLUMN privileges: role/id/etc. become unwritable by clients.
revoke update on public.profiles from anon, authenticated;
grant  update (full_name, avatar_url) on public.profiles to authenticated;

-- Layer 2 — RLS row scope: authenticated, own row only.
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ( auth.uid() = id ) with check ( auth.uid() = id );
```

Result: an authenticated user can update **only** `full_name`/`avatar_url` on **their own** row.
`role` and every identity field are unwritable by clients; `role` changes run **only** through the
admin-gated server action via the **service-role** client (which is unaffected by the column
revoke). `service_role` **UPDATE on `public.profiles`** was verified present (required by the role
change + the Phase 12.5 email change). The `profiles_updated_at` BEFORE-UPDATE trigger bumps
`updated_at` automatically, so the user needs no privilege on it (it also serves as the avatar
cache-bust token).

### 3b. Role-aware RLS tightening (Phase 17 — APPLIED)

Phase 17 (Security Review) replaced the permissive `using(true)` policies on `students`,
`reading_sessions`, `reading_passages`, and `vocabulary_terms` with role-aware least-privilege
policies, applied to the live DB via
[`supabase/schema.sql`](../../supabase/schema.sql). Two
`SECURITY DEFINER` helper functions back the policies (recursion-safe; `search_path` pinned to
`public`; `EXECUTE` granted to `authenticated` only):

- **`public.is_staff()`** — the current user's `profiles.role` is `admin` or `teacher`.
- **`public.is_my_student(sid uuid)`** — the current user owns the `students` row `sid` via
  `students.profile_id = auth.uid()` (the Phase 12.5 identity link).

Resulting policies (table grants unchanged — the tightened RLS is the gate):

- `students` — SELECT `is_staff() OR profile_id = auth.uid()`; INSERT/UPDATE/DELETE `is_staff()`.
- `reading_sessions` — SELECT `is_staff() OR is_my_student(student_id)`; INSERT
  `is_my_student(student_id)`; **no** UPDATE/DELETE policy (the app never updates/deletes sessions).
- `reading_passages` / `vocabulary_terms` — SELECT stays `true` (all roles read content);
  INSERT/UPDATE/DELETE `is_staff()`.

`profiles` / `user_settings` were already tight (§3, §3a) and are unchanged. The self-service claim,
activation-link, reconcile, registration, and email-change flows use the **service-role** admin client
(bypasses RLS) and are unaffected. The verified live-audit baseline, findings (F1–F8 + D1), and the
verification matrix live in [`docs/Security.md`](../Security.md).

> **Correction (superseding the pre-Phase-17 text above/§2).** The earlier note that roster/content
> writes were *"privileged writes via service-role"* did **not** match the live DB — `authenticated`
> held full table grants and the `using(true)` policies allowed any authenticated user to write. Phase
> 17's audit verified this and the tightening above closes it. `setup.sql` and any pre-Phase-17 policy
> description are **historical**; this section + `docs/Security.md` are the current record.

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

Bucket: **`avatars`** — profile avatars. `profiles.avatar_url` stores the **object path**
(`avatars/{user_id}/avatar.webp`), never a URL; the app builds the public URL at runtime.

**Bucket settings (Phase 12.6 — APPLIED):** **Public** read · `file_size_limit` **1 MB** ·
`allowed_mime_types` **`image/webp,image/png,image/jpeg`**.

**`storage.objects` policies (Phase 12.6 — APPLIED, all four REQUIRED):** owner-scoped writes (each
user only under their own `{user_id}/` folder) **plus a SELECT policy** — see §6a for why the SELECT
policy is required even though the app calls no read API.

```sql
create policy "avatars_owner_insert" on storage.objects for insert to authenticated
  with check ( bucket_id='avatars' and (storage.foldername(name))[1] = auth.uid()::text );
create policy "avatars_owner_update" on storage.objects for update to authenticated
  using      ( bucket_id='avatars' and (storage.foldername(name))[1] = auth.uid()::text )
  with check ( bucket_id='avatars' and (storage.foldername(name))[1] = auth.uid()::text );
create policy "avatars_owner_delete" on storage.objects for delete to authenticated
  using      ( bucket_id='avatars' and (storage.foldername(name))[1] = auth.uid()::text );
-- REQUIRED: the upsert upload path internally reads storage.objects (see §6a).
create policy "avatars_public_read" on storage.objects for select to public
  using ( bucket_id='avatars' );
```

The upload is **transactional** in the server action: upload → persist path → **on DB failure,
delete the uploaded object** (compensation). The stable path (`avatar.webp`) means replace is an
overwrite, so there are no orphaned files.

### 6a. `avatars_public_read` is REQUIRED (verified in production)

**Verified behavior (corrects an earlier wrong assumption).** The `avatars_public_read` SELECT
policy on `storage.objects` is **intentionally required and must remain.** Real-world testing
confirmed: **removing it breaks avatar upload/replace, and re-adding it immediately restores them.**

Although the application calls **no** Storage **read** API directly — only
`supabase.storage.from('avatars').upload(..., { upsert: true })` and `.remove([...])` in
[`features/settings/profile-actions.ts`](../../features/settings/profile-actions.ts), plus a manually
built public object URL in [`lib/avatar.ts`](../../lib/avatar.ts) — **Supabase Storage internally
requires SELECT access on `storage.objects` for the upsert workflow.** An `upsert: true` upload reads
the existing object (existence check, to decide insert-vs-update on the stable `avatar.webp` path); if
RLS denies that internal SELECT, the upload/replace fails. The write policies alone are therefore
**not sufficient** for our upload path.

> **Do NOT remove `avatars_public_read`.** It is load-bearing for upload/replace, not just for object
> display. All **four** policies (`avatars_owner_insert` / `_update` / `_delete` / `avatars_public_read`)
> are required.

> ⚠️ **Invariant: the `avatars` bucket MUST remain Public.** Avatar display uses public object URLs
> (`/object/public/...`, served by the bucket's Public flag). If the bucket is ever changed to
> Private, the avatar system must — **before deployment** — migrate to **signed URLs**
> (`createSignedUrl`) and re-verify the `storage.objects` read policies, or every avatar URL will
> return HTTP 400.

> **Lesson recorded:** the earlier "no read API in code ⇒ no SELECT policy needed" reasoning was a
> static-analysis assumption that did **not** hold — the Storage service performs internal reads the
> app never issues. Storage RLS requirements must be confirmed by **runtime testing**, not by source
> grep alone.

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

1. Create the Supabase project and apply [`supabase/schema.sql`](../../supabase/schema.sql) (the
   canonical current-state SQL — tables, indexes, triggers, RLS, grants, helper functions).
2. **Authentication → Email → Confirm email = OFF.** Leave SMTP unconfigured.
3. Add each app origin's `/api/auth/callback` URL to the **redirect allow-list**.
4. Verify `service_role` has `SELECT, INSERT, UPDATE` on `public.students` (§2 query). Grant only if
   missing.
5. Confirm RLS is enabled on all tables with the policies in §3 (including `settings_insert_own`, the
   own-row `profiles`/`user_settings` SELECT policies, and the §3a `profiles` self-edit hardening).
6. Confirm the FK `ON DELETE` semantics in §5.
7. Create the `avatars` storage bucket — **Public**, 1 MB limit, image MIME allow-list (§6). Apply
   **all four** `storage.objects` policies (`avatars_owner_insert` / `_update` / `_delete` **and**
   `avatars_public_read`). The SELECT policy is **required** — the upsert upload path internally reads
   `storage.objects`, so without it upload/replace fails (§6a). Keep the bucket **Public** (see the
   §6a invariant for the Private-migration requirement).
8. Set the four environment variables (§7); keep the service-role key server-only.
9. Do **not** add an `on auth.users` trigger (§4).
