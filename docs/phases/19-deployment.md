# Phase 19 — Deployment

## Goal
Make the project genuinely production-ready to ship.

## Build
- Production environment setup
- Environment validation (fail fast on missing required env vars)
- Deployment configuration
- SEO basics
- Metadata strategy (localized, per Phase 4)
- `robots.txt`
- `sitemap.xml`

## Docs to create
- `Deployment.md` — deployment steps, required environment variables, rollback plan

## Definition of done
- App fails clearly at startup/build if a required env var
  (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) is
  missing, rather than failing silently at runtime.
- `sitemap.xml`/`robots.txt` respect locale routes.
