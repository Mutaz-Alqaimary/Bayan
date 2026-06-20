# Architecture & Naming (authoritative)

## Stack
Next.js 16, App Router, Server Components by default, Client Components only when interactivity requires it. React 19. TypeScript 5 (strict). Tailwind CSS 4. shadcn/ui. next-intl. Zustand. React Hook Form + Zod. TanStack Table. SheetJS. Lucide React. Supabase JS. Optional: Framer Motion, Radix UI.

If any of these are already set up in the repo (check `package.json` and existing config files first), extend the existing setup instead of reinitializing it.

## Architecture rules
- Feature-based folder structure — group by domain (`students/`, `reading-passages/`, `vocabulary/`, `reading-sessions/`, `settings/`, ...), not by file type.
- Server Components by default; mark Client Components explicitly and only when needed.
- Type-safe data layer: every Supabase query goes through typed helpers, never inline `any`.
- Reusable UI patterns over one-off components. No god components. No deep prop drilling — use composition, context, or a Zustand store instead.
- No duplicated logic — extract shared logic into hooks/utilities.
- No hardcoded user-facing strings — everything goes through next-intl.
- No hardcoded routes — centralize route definitions in one place.

## Naming — never invent alternatives

**Database record types** (mirror the schema in `database-schema.md` exactly):
`ProfileRecord`, `StudentRecord`, `ReadingPassageRecord`, `ReadingSessionRecord`, `VocabularyTermRecord`.

**Form types**:
`LoginFormValues`, `RegisterFormValues`, `CreateStudentFormValues`, `UpdateStudentFormValues`.
Follow the `<Action><Entity>FormValues` pattern for any new form (e.g. `CreatePassageFormValues`).

**Zustand stores**:
`useAuthStore`, `useStudentStore`, `useSettingsStore`, `useReadingStore`.
Follow the `use<Domain>Store` pattern for any new store.

**Supabase clients**:
`supabaseClient` (browser), `supabaseServerClient` (server). Never create a third, differently-named client.

## Quality bar
- Strict TypeScript, ESLint clean, no `any` without explicit justification in a comment.
- Zod validation on every form and every boundary where external/user input enters the system.
- Every list/table/detail view needs loading (skeleton), empty, and error states — see `arabic-and-design.md`.
- Every interactive component must be keyboard-navigable and screen-reader friendly.