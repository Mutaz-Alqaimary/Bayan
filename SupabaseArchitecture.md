# Supabase Architecture

How Bayan integrates Supabase for data access, authentication, session handling, and
authorization. Established in **Phase 2**. The database is a **fixed, read-only contract** —
see [`.claude/rules/database-schema.md`](.claude/rules/database-schema.md). Never create tables,
columns, migrations, or SQL here.

> **RLS note (updated Phase 17).** The "RLS SELECT policies (current contract)" section below describes
> the **pre-Phase-17** permissive (`using(true)`) state. Phase 17 (Security Review) replaced those with
> **role-aware least-privilege** policies (`is_staff()` / `is_my_student()`). For the current RLS
> contract see [`docs/project/current-architecture.md`](docs/project/current-architecture.md) §4,
> [`docs/database/manual-supabase-configuration.md`](docs/database/manual-supabase-configuration.md) §3/§3b,
> and [`docs/Security.md`](docs/Security.md). The client/session/registration content here remains current.

## Environment

Public values are read and validated once in [`lib/supabase/env.ts`](lib/supabase/env.ts):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

`SUPABASE_SERVICE_ROLE_KEY` is **deliberately not exported from any client-importable module**.
It must only ever be read in server-only code (and is not needed by any Phase 2 feature). If a
future phase needs elevated access, add a separate server-only client that reads it directly and
guard that file with `import "server-only"`.

## Clients

| Client | File | Use in | Notes |
|---|---|---|---|
| `supabaseClient` | [`lib/supabase/client.ts`](lib/supabase/client.ts) | Client Components | Browser singleton (`createBrowserClient`). |
| `supabaseServerClient()` | [`lib/supabase/server.ts`](lib/supabase/server.ts) | Server Components, Server Actions, Route Handlers | Async; bound to the current request's cookies. Call per request; never cache. |

Names are fixed by [`.claude/rules/naming-conventions.md`](.claude/rules/naming-conventions.md).
`supabaseServerClient` is a function (not a singleton) because it must read `cookies()` per
request. Its `setAll` is wrapped in try/catch: when called from a Server Component (cookies are
read-only) the write is safely ignored, because the proxy refreshes cookies on every request.

## Session handling (proxy)

Next.js 16's [`proxy.ts`](proxy.ts) (renamed Middleware) runs two concerns on every matched
request, sharing **one** response:

1. **next-intl locale routing** — `/` → default locale, prefix validation, locale cookie.
2. **Supabase session refresh** — [`lib/supabase/proxy.ts`](lib/supabase/proxy.ts)
   `updateSession(request, response)` creates a request-bound server client and calls
   `auth.getUser()`, which rotates the auth tokens and writes the refreshed cookies onto the
   i18n response.

```ts
const response = handleI18nRouting(request);
return updateSession(request, response);
```

> Critical: no logic runs between creating the client and `getUser()` — that call is what
> triggers the refresh and the `setAll` cookie writes. Reordering this can silently log users out.

The `proxy` matcher excludes `api`, `_next`, `_vercel`, and static files (anything with a `.`).

## Authentication & the session shape

[`features/auth/queries.ts`](features/auth/queries.ts) → `getSessionUser()` returns a
`SessionUser | null`:

- Uses `auth.getUser()` (validates the token against the Auth server) — **not** `getSession()`,
  which trusts the unverified cookie. Always use `getUser()` for trust decisions.
- Joins the `profiles` row and validates `profiles.role` with `isUserRole` before trusting it.

```ts
type SessionUser = { id: string; email: string | null; role: UserRole; profile: ProfileRecord };
```

## Authorization

### Role & capability helpers — [`features/auth/roles.ts`](features/auth/roles.ts)

Pure functions encoding the minimum-permissions matrix from
[`.claude/rules/architecture.md`](.claude/rules/architecture.md), used for **both** UI gating and
data-layer gating so they never drift:

- `isAdmin` / `isTeacher` / `isStudent`, and `isUserRole` (runtime guard)
- `canManageUsers` (admin), `canManageStudents`, `canManageContent`, `canAccessAnalytics`,
  `canAccessReports` (admin + teacher)

### Route guards — [`features/auth/guards.ts`](features/auth/guards.ts)

Server-only. Call at the top of a protected Server Component, layout, or action:

- `requireUser()` → `SessionUser`, else redirects to login.
- `requireRole(...roles)` → `SessionUser` if the role matches, else redirects (unauthenticated →
  login, unauthorized → home).

Redirect targets come from [`lib/routes.ts`](lib/routes.ts) (`ROUTES`), localized via
`getPathname` and Next's `redirect`. The login/dashboard pages are built in later phases (auth:
Phase 5, dashboard: Phase 6); the guards already reference the constants so nothing is hardcoded.

> **Never trust the client.** UI may hide/disable actions a role can't perform, but every
> protected read/write must also be gated server-side (guards + role helpers, and — where
> configured — Supabase Row Level Security).

### RLS SELECT policies (current contract)

RLS is enabled on every table. The policies that exist today (from the Supabase setup) determine
what the **anon/authenticated** client can read, and therefore where app-layer scoping or the
service-role client is required:

| Table | SELECT policy | Implication |
|---|---|---|
| `profiles` | own row only (`auth.uid() = id`) | Cross-user/role reads (e.g. admin counting teachers) need `supabaseAdminClient`, role-gated. **No INSERT policy** → registration profile insert uses the service-role client (Phase 5). |
| `user_settings` | own row only (`auth.uid() = user_id`) | Each user reads/writes only their own settings. |
| `students` | any authenticated (`true`) | Admin/teacher read all; **student dashboards must scope to their own `student_id` in-query** (RLS does not). |
| `reading_passages` | any authenticated (`true`) | Readable by all roles. |
| `vocabulary_terms` | any authenticated (`true`) | Readable by all roles. |
| `reading_sessions` | any authenticated (`true`) | Same as `students` — scope per student in app code; never rely on RLS for student isolation. |

Because `students` / `reading_passages` / `reading_sessions` SELECT is permissive for authenticated
users, the admin/teacher dashboard totals over those tables use the normal `supabaseServerClient`;
only the `profiles`-derived counts cross RLS and use the role-gated `supabaseAdminClient`.

## Registration & the service-role client (Phase 5)

The locked schema has **no `profiles` INSERT policy** and **no `on auth.users` signup trigger**, and
`profiles.full_name` / `profiles.role` are `NOT NULL`. A self-service registrant therefore cannot
create their own `profiles` row under RLS. Per the "elevated access" note above, Phase 5 adds a
**server-only service-role client** — never imported into client code:

| Client | File | Use in | Notes |
|---|---|---|---|
| `supabaseAdminClient()` | [`lib/supabase/admin.ts`](lib/supabase/admin.ts) | Server Actions / Route Handlers only | Reads `SUPABASE_SERVICE_ROLE_KEY`; `persistSession: false`, no cookies. Guarded with `import "server-only"`. **Bypasses RLS — only ever use it to perform an explicitly authorized, server-validated operation.** |

### Role assignment (locked policy)

Self-registration **always** creates a `student`. The role is hard-coded server-side; it is never
read from client input, so a user cannot self-assign `teacher` or `admin`. Teacher/admin accounts
are provisioned or promoted by an administrator.

### Public registration uses `signUp()`, not `admin.createUser()` (Phase 12.5)

Public self-registration is **user-initiated**, so the auth user is created with the normal
`supabase.auth.signUp()` flow through the **cookie-bound server client** — *not* the admin API. With
"Confirm email" disabled, `signUp()` **auto-confirms and establishes the session in one step** (no
separate `signInWithPassword`, no `email_confirm` flag), and it enforces the platform's signup
protections (rate limiting, password policy) that the admin API bypasses. `admin.createUser()` is
reserved for **admin provisioning / invitations** (`features/students/identity/actions.ts`).

### Atomic registration — failure strategy (saga + compensating rollback)

`signUpAction` keeps registration atomic so the system is never left with a partially-initialized
account (every account ends with `auth.users` + `profiles` + `user_settings` + `students`):

1. **Reconcile by email** (`getStudentByEmail`, service-role). A roster row already linked to a
   profile → `emailTaken`. An *unlinked* roster row → the account is created unlinked for the secure
   `student_number` claim (never auto-claimed by email).
2. **`signUp()`** (server client) → creates the auth user, auto-confirms, and establishes the
   session. Duplicate email (error or an obfuscated no-identities user) → `emailTaken`. A missing
   session (would mean confirmation is required — a config mismatch) → roll back.
3. **Insert `profiles`** (service-role — no INSERT policy; role fixed server-side).
4. **Insert `user_settings`** via the **session client** — the just-signed-in user inserts its own
   row under `settings_insert_own` RLS (no service-role grant on `user_settings` needed).
5. **Insert the linked `students`** row + generated `student_number` (service-role), unless the
   email-collision case left it unlinked.
6. **Redirect** to the dashboard (the session already exists).

On any insert failure → **compensating rollback**: delete the just-created auth user
(`auth.admin.deleteUser`, which cascades `profiles`/`user_settings`) and clear the session, freeing
the email for a clean retry. Residual risk: if the delete also fails, an orphaned auth user remains —
logged server-side and defended at the login boundary (`signInAction` signs out a profile-less
session rather than granting a broken one).

## Type-safe data layer

- Every query/mutation is wrapped in a typed function in a feature's `data`/`queries` module —
  no ad-hoc `.from("table")` scattered through components.
- Server-only data modules start with `import "server-only"` so they can never be bundled into
  client code.
- Results are typed with the named domain record types (`ProfileRecord`, etc.) from
  [`.claude/rules/naming-conventions.md`](.claude/rules/naming-conventions.md).

### Generated database types (required, not yet present)

Supabase database types are **always generated from the Supabase CLI and never hand-written**
(see [`Architecture.md`](Architecture.md)). When added:

```bash
supabase gen types typescript --project-id <project-id> > lib/supabase/database.types.ts
```

Then:

1. Thread the generic into both clients: `createBrowserClient<Database>(...)`,
   `createServerClient<Database>(...)`.
2. Derive the record types from the generated types instead of hand-authoring them, e.g.
   `type ProfileRecord = Database["public"]["Tables"]["profiles"]["Row"]`.

Until then, `ProfileRecord` is hand-authored from the documented schema as the typed contract,
and typed query results use the result generic (e.g. `.single<ProfileRecord>()`).

## File map

```text
proxy.ts                      # i18n routing + Supabase session refresh
lib/supabase/
  env.ts                      # validated public env (no service-role key)
  client.ts                   # supabaseClient (browser singleton)
  server.ts                   # supabaseServerClient() (per-request)
  proxy.ts                    # updateSession() session refresh
lib/routes.ts                 # ROUTES (locale-agnostic paths)
features/auth/
  types.ts                    # UserRole, ProfileRecord, SessionUser
  roles.ts                    # role + capability helpers, isUserRole
  queries.ts                  # getSessionUser() (server-only data layer)
  guards.ts                   # requireUser(), requireRole() (server-only)
```
