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
