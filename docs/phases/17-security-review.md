# Phase 17 — Security Review

## Goal
Review what's been built for security issues before reporting/deployment phases.

## Review
- Authentication
- Authorization (role gating enforced server-side, not just hidden in UI)
- Route protection
- Input validation (Zod coverage, no trusting client input)
- Supabase security (RLS-equivalent checks, service role key never exposed client-side)
- File upload security (avatars bucket — type/size validation)
- Environment variable safety (no secrets in client bundles or committed files)

## Docs to create
- `Security.md` — findings and how each was addressed

## Definition of done
- `SUPABASE_SERVICE_ROLE_KEY` confirmed server-only, never reachable from client code/bundle.
- Every mutation re-validated against the role permission matrix in
  `.claude/rules/architecture.md`, not just gated by hiding a button in the UI.
- Avatar uploads validated for type/size before hitting the `avatars` bucket.
