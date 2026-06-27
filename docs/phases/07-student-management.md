# Phase 7 — Student Management

> **Extended by Phase 12.5.** Student Management now also surfaces the derived **account-status**
> column (`roster_only` / `invited` / `active`), **admin-only email management** that propagates a
> linked student's email to `auth.users` with compensation, the **activation-link** dialog (provision
> + copyable set-password link, no SMTP), and the one-time **reconcile** backfill. Identity resolves
> by `profile_id`, never email. See
> [`docs/project/current-architecture.md`](../project/current-architecture.md) §5, §8, §10, §11 — it
> supersedes the original spec below where they differ.

## Goal
Full CRUD on the `students` table, exposed appropriately by role (admin and teacher; see
`.claude/rules/architecture.md`).

## Build
- CRUD (uses `StudentRecord`, `CreateStudentFormValues`, `UpdateStudentFormValues`)
- Search
- Filters
- Pagination
- Sorting
- TanStack Table

## Definition of done
- Search/sort behave correctly for Arabic names (`first_name_ar`/`last_name_ar`) — not
  locale-naive string comparison.
- Table is responsive (degrades sensibly on mobile, not just overflow-scroll).
- Loading, empty ("no students found" with a clear next action), and error states present.
- Role gating enforced both in UI and at the data layer.
