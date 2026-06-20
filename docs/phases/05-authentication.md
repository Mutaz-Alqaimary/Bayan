# Phase 5 — Authentication

## Goal
Build auth flows on Supabase Auth for all three roles.

## Build
- Login
- Register
- Forgot Password
- Reset Password

## Roles
admin, teacher, student — see `.claude/rules/architecture.md` for the permission matrix.

## Definition of done
- Forms use `LoginFormValues` / `RegisterFormValues` per
  `.claude/rules/naming-conventions.md`, validated with Zod, localized error messages.
- Post-auth redirect respects role (admin/teacher/student land on the right dashboard once
  Phase 6 exists).
- Loading, empty, and error states present (e.g. failed login shows a clear, localized,
  non-technical error).
