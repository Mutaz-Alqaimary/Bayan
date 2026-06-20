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
