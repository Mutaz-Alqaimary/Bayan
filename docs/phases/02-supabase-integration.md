# Phase 2 — Supabase Integration

## Goal
Wire up Supabase access for the existing schema (`.claude/rules/database-schema.md`) — never
create schema or migrations here.

## Build
- Supabase client (`supabaseClient`)
- Supabase server client (`supabaseServerClient`)
- Proxy file (Next.js 16)
- Auth helpers
- Session handling
- Protected routes
- Role helpers (admin/teacher/student gating per `.claude/rules/architecture.md`)

## Docs to create
- `SupabaseArchitecture.md` — client/server client usage, session handling, route protection

## Definition of done
- Client and server clients exactly named per `.claude/rules/naming-conventions.md`.
- No table, column, or migration was invented — only the schema in
  `.claude/rules/database-schema.md` is referenced.
- Role helpers correctly gate by `profiles.role`.
