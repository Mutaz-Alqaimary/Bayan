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
| Manage teachers / change roles (Phase 12.6) | ✅ | | |
| Manage students | ✅ | ✅ | |
| Manage reading content (passages, vocabulary) | ✅ | ✅ | |
| Reading analytics access | ✅ | ✅ | |
| Reporting access | ✅ | ✅ | |
| View assigned content | ✅ | ✅ | ✅ |
| Complete reading sessions | | | ✅ |
| View personal progress | | | ✅ |
| Edit own profile (name + avatar) (Phase 12.6) | ✅ | ✅ | ✅ |
| Manage personal settings | ✅ | ✅ | ✅ |

Enforce this both at the UI level (hide/disable what a role can't do) and at the data layer
(never trust the client — gate Supabase queries/mutations by role too).

## Role management invariant (Phase 12.6)

A **teacher is exactly `profiles.role = 'teacher'`** — there is no `teachers` table. The admin
manages teachers from `/teachers` (admin-only) by changing **only** `profiles.role` between `student`
and `teacher` (`canManageTeachers` gates the surface; `canChangeRole`/`MANAGEABLE_ROLES` the
transition). The write runs through the service-role client (role is unwritable by clients) and
never touches `students` / `profile_id` / `auth.users` / `user_settings` / `reading_sessions` — the
Phase 12.5 identity model is untouched, so demotion is lossless and a promoted teacher keeps any
roster row + reading history (intentional dual presence, flagged in Student Management).

**Admin is infrastructure-only:** the application must never create, assign, promote, or escalate to
`admin` (enforced in both UI and the server action). Only authenticated users (a `profiles` row) are
promotable; an actor can never change their own role.

**Profile self-edit:** users may edit only their own `full_name` and `avatar_url` (in Settings),
enforced at the DB layer by the column-scoped `profiles_update_own` policy. Email stays
admin-managed; role stays server-only. `avatar_url` stores the storage object path, not a URL.

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
