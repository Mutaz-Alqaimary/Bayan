# Phase 5 — Authentication

> **Updated by Phase 12.5.** Registration was expanded into a **one-step public flow** that builds
> the full student identity (`auth.users` + `profiles` + `user_settings` + `students` + auto
> `student_number`) using `supabase.auth.signUp()` (not `admin.createUser()`), and now collects
> Arabic first/last name + grade. For the current registration saga and identity model, read
> [`docs/project/current-architecture.md`](../project/current-architecture.md) §3, §5, §7 — it
> supersedes the original spec below where they differ.

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
