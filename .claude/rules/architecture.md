---
description: Feature-based architecture, Server/Client Component rules, and the role-based authorization matrix.
---

# Architecture & Authorization

## Architecture rules

- **Feature-based** folder structure (`features/students/`, `features/reading/`, etc.), not
  type-based dumping grounds (`components/`, `hooks/`, `utils/` for everything).
- **App Router** throughout.
- **Server Components by default.** Reach for a Client Component only when you need state,
  effects, browser APIs, or event handlers — and keep the client boundary as small as possible
  (push it down to a leaf component, don't make a whole page `"use client"`).
- **Strict TypeScript.** No `any`, no silent type assertions to dodge a real type error.
- **Type-safe data layer.** Every Supabase query/mutation should be wrapped in a typed function,
  not ad-hoc `.from("table")` calls scattered through components.
- **Reusable UI patterns**, not copy-pasted near-duplicates.

Avoid: god components, deep prop drilling (use Zustand stores or composition instead),
duplicated logic, hardcoded strings (use next-intl), hardcoded routes.

## Roles

`admin`, `teacher`, `student`.

## Minimum permissions

| Capability | Admin | Teacher | Student |
|---|:---:|:---:|:---:|
| Full platform access / user management | ✅ | | |
| Manage students | ✅ | ✅ | |
| Manage reading content (passages, vocabulary) | ✅ | ✅ | |
| Reading analytics access | ✅ | ✅ | |
| Reporting access | ✅ | ✅ | |
| View assigned content | ✅ | ✅ | ✅ |
| Complete reading sessions | | | ✅ |
| View personal progress | | | ✅ |
| Manage personal settings | ✅ | ✅ | ✅ |

Enforce this both at the UI level (hide/disable what a role can't do) and at the data layer
(never trust the client — gate Supabase queries/mutations by role too).

## Student identity invariant (Phase 12.5)

A student's permanent identity is the link **`auth.users.id ↔ profiles.id ↔ students.profile_id`**
(`profiles.id = auth.users.id`; `students.profile_id` references it, `ON DELETE SET NULL`).

- **Resolve a student by `profile_id`, never by email.** Email is used only for (a) authentication,
  (b) communication, and (c) *initial roster matching before linking*. After linking, changing the
  email must not affect identity. Every feature — Reading Sessions, Reading Analytics, dashboards,
  progress tracking, permissions, route guards — resolves the student through `profile_id`
  (`getLinkedStudentId`), not `students.email`.
- **One unified flow.** Public self-registration creates the full identity
  (`auth.users` + `profiles` + `user_settings` + `students`, with an auto-generated `student_number`).
  If an unlinked roster row already holds the email, the account is created unlinked and the student
  links it from the onboarding/claim state with their **`student_number`** — email alone never claims
  a record (Supabase email confirmation is off; emails are unverified by design).
- **Email is admin-managed.** Students cannot change their own email anywhere (Settings exposes no
  email field). Only admin/teacher change it, from Student Management; when the student is linked the
  change updates **both** `auth.users.email` and `students.email` as one application-level operation
  with compensation, never touching `profile_id`.
- **`student_number` is the claim secret** — app-generated, high-entropy (see
  `naming-conventions.md` → Phase 12.5).

`profile_id` is populated by the application (registration, claim, admin activation link, the
one-time reconciliation backfill); it is `NULL` only for a roster-only record not yet linked, or
after the linked account was deleted (the academic record and its reading history survive).
