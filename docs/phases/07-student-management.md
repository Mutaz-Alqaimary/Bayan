# Phase 7 — Student Management

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
