# Features

Bayan uses a **feature-based** architecture (see `.claude/rules/architecture.md`). Domain code
lives here, grouped by feature rather than by file type. Each feature owns its components,
hooks, stores, data-layer functions, and types.

Convention for a feature folder (created when the feature is first built, in its phase):

```
features/<feature>/
  components/   # feature-specific UI (composed from the shared design system in components/ui)
  data/         # typed Supabase queries/mutations for this feature
  hooks/        # feature hooks
  schemas/      # Zod schemas + inferred form value types
  store.ts      # the feature's Zustand store (e.g. useStudentStore)
  types.ts      # feature record/view types (e.g. StudentRecord)
```

Planned features by phase:

| Feature | Phase |
|---|---|
| `auth` | 5 |
| `dashboard` | 6 |
| `students` | 7 |
| `reading` (passages, vocabulary) | 8 |
| `reading-sessions` (fluency) | 10 |
| `analytics` | 13 |
| `settings` | 12 |
| `reporting` | 18 |

Cross-cutting, non-domain code stays out of `features/`:

- `components/ui/` — the shared design-system primitives (Phase 3)
- `components/layout/` — app chrome (header, footer, navigation shell)
- `components/providers/` — app-wide providers
- `i18n/` — locale routing, navigation, request config
- `lib/` — framework-agnostic utilities (`cn`, fonts, theme helpers)
