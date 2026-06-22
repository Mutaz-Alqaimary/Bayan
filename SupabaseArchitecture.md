# Supabase Architecture

How Bayan integrates Supabase for data access, authentication, session handling, and
authorization. Established in **Phase 2**. The database is a **fixed, read-only contract** —
see [`.claude/rules/database-schema.md`](.claude/rules/database-schema.md). Never create tables,
columns, migrations, or SQL here.

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
are provisioned or promoted by an administrator in a later phase. Email confirmation is **off**: a
successful registration creates the user, creates the profile, signs them in, and redirects.

### Atomic registration — failure strategy (saga + compensating delete)

`signUpAction` makes registration atomic so the system is never left with an auth user that has no
profile (which `getSessionUser()` treats as unauthenticated, permanently stranding the email):

1. **Create the auth user** with `auth.admin.createUser({ email_confirm: true })` (admin client).
   - On error → map to `emailTaken` (duplicate email) or a generic error. Nothing was created, so
     no cleanup is needed.
2. **Insert the `profiles` row** (`id`, `full_name`, `role: "student"`, `locale`) with the admin
   client.
   - On error → **compensating action: delete the just-created auth user**
     (`auth.admin.deleteUser`), then return a generic "registration failed" error. The email is
     freed for a clean retry. The session is *not yet* established, so there is no half-signed-in
     state.
3. **Establish the session** with the cookie-bound `supabaseServerClient().auth.signInWithPassword`
   — only after **both** the user and profile exist.
4. **Redirect** to the dashboard.

Residual risk: if the profile insert fails *and* the compensating delete also fails, an orphaned
auth user remains. This is logged server-side and defended at the login boundary — `signInAction`
calls `getSessionUser()` after sign-in and, if no profile exists, signs the user out and returns an
error instead of granting a broken session.

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
