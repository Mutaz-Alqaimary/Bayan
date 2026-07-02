# Deployment

How Bayan is deployed and operated. Target platform is **Vercel only**; the
production deployment is <https://bayan-reading.vercel.app>.

Bayan is a standard Next.js 16 App Router app, so Vercel builds and serves it
with **zero extra config** — there is intentionally no `vercel.json`. Everything
platform-specific is expressed through environment variables and the Next.js
file conventions already in the repo.

---

## Required environment variables

Set these in the Vercel project (**Settings → Environment Variables**) for the
**Production**, **Preview**, and **Development** environments, and in a local
`.env.local` for development. A committed template lives in
[`.env.example`](../.env.example).

| Variable | Scope | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL (inlined into the browser bundle). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anon key (inlined into the browser bundle). |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-only** | Service-role key — bypasses RLS. Never expose to the client. |
| `NEXT_PUBLIC_SITE_URL` | Public | Canonical origin (no trailing slash), e.g. `https://bayan-reading.vercel.app`. Drives `metadataBase`, canonical/hreflang URLs, `robots.txt`, `sitemap.xml`, and auth redirect links. |

### Fail-fast validation

The app validates required variables **at startup** so a misconfiguration fails
loudly instead of silently at the first request:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are validated on
  import in [`lib/supabase/env.ts`](../lib/supabase/env.ts) (they throw if
  missing, which surfaces during `next build`).
- `SUPABASE_SERVICE_ROLE_KEY` is asserted at server startup in
  [`instrumentation.ts`](../instrumentation.ts) (Next.js `register()` hook),
  bringing it under the same guarantee instead of only failing lazily when an
  admin action runs.

If a required variable is missing, the process throws
`Missing required environment variable: <NAME>` — set it in Vercel and redeploy.

`NEXT_PUBLIC_SITE_URL` is not fail-fast: [`lib/site-url.ts`](../lib/site-url.ts)
falls back to the Vercel deployment origin and then to the production URL, so SEO
metadata never breaks. Set it explicitly in production for correct canonical/OG
URLs.

---

## Required Supabase configuration

The database, RLS policies, grants, and storage bucket are **not** provisioned by
this deploy — they already exist and are the source of truth. Anything not
expressible in SQL (dashboard auth settings, the `avatars` bucket, "Confirm
email" OFF, no SMTP) is documented in
[`docs/database/manual-supabase-configuration.md`](database/manual-supabase-configuration.md).
Security posture and RLS are covered in [`docs/Security.md`](Security.md).

When pointing a deployment at a Supabase project, confirm:

- The three Supabase env vars above match that project.
- Auth redirect / allowed URLs include the deployment origin (see the manual
  configuration doc) so the auth callback and activation links resolve.

---

## Deploy steps (Vercel)

1. **Connect the repo** to a Vercel project (once). Framework preset: Next.js —
   detected automatically. No build/output overrides are needed.
2. **Set environment variables** (table above) for Production, Preview, and
   Development.
3. **Push to the production branch** (`main`). Vercel runs `next build` and
   promotes the deployment. Pull requests get automatic Preview deployments.
4. **Verify** after deploy:
   - `/{locale}` renders with a localized `<title>`, `description`, canonical,
     and hreflang tags.
   - `/robots.txt` returns rules + the sitemap URL.
   - `/sitemap.xml` lists the public pages for both `ar` and `en`.

### Production build locally

Reproduce the Vercel build before shipping:

```bash
pnpm install
pnpm lint
pnpm build      # runs `next build`
pnpm start      # serves the production build
```

---

## Rollback procedure

Deployments are immutable, so rollback is instant and needs no rebuild:

1. Open the Vercel project → **Deployments**.
2. Find the last known-good deployment.
3. Use **⋯ → Promote to Production** (or **Instant Rollback**) to re-point the
   production alias at it.

For a code-level revert, revert the offending commit on `main` and push — Vercel
builds and promotes the corrected deployment. If a rollback was caused by an
env-var change, correct the variable in Vercel and redeploy (env-var edits do not
take effect on existing deployments until a new build runs).

---

## Related documentation

- Architecture (how the system works today): [`docs/project/current-architecture.md`](project/current-architecture.md)
- Manual Supabase config: [`docs/database/manual-supabase-configuration.md`](database/manual-supabase-configuration.md)
- Security & RLS: [`docs/Security.md`](Security.md)
- Performance: [`docs/Performance.md`](Performance.md)
