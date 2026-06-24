---
description: Exact, fixed names for types, stores, and Supabase clients across Bayan. Never invent alternatives.
---

# Naming Conventions

These names are fixed across the whole codebase. Reuse them exactly — don't paraphrase, don't
add suffixes, don't rename "for clarity."

## Database record types

```
ProfileRecord
StudentRecord
ReadingPassageRecord
ReadingSessionRecord
VocabularyTermRecord
```

## Form value types

```
LoginFormValues
RegisterFormValues
ForgotPasswordFormValues
ResetPasswordFormValues
CreateStudentFormValues
UpdateStudentFormValues
```

Follow this `<Verb><Entity>FormValues` pattern for any additional forms introduced in later
phases (e.g. `CreatePassageFormValues`, `UpdateVocabularyTermFormValues`).

## Zustand stores

```
useAuthStore
useStudentStore
useSettingsStore
useReadingStore
```

## Supabase clients

```
supabaseClient        // browser/client-side
supabaseServerClient   // server-side
supabaseAdminClient    // server-only, service-role (bypasses RLS) — added Phase 5
```

## Localized message helpers

Client/server-paired accessors for shared, cross-feature copy (validation, generic error
states) — same `client.ts`/`server.ts` split as the Supabase clients above.

```
useValidationMessages  // client — lib/validation/client.ts
getValidationMessages  // server — lib/validation/server.ts
ValidationMessages     // shared type — lib/validation/types.ts

useErrorMessages        // client — lib/errors/client.ts
getErrorMessages        // server — lib/errors/server.ts
ErrorMessages            // shared type — lib/errors/types.ts
```

## Student import/export (Phase 9)

The CSV/XLSX bulk-import & export pipeline lives in `features/students/import-export/`. Names:

```
StudentImportRow         // one parsed row's editable values (alias of CreateStudentFormValues)
RawStudentImportRow      // a parsed row + its 1-based source row number
StudentImportRowOutcome  // a row's create/update/skip/reject classification
StudentImportPreview     // the full classification the preview renders
StudentImportCounts      // bucket totals for the preview summary
StudentImportMessages    // localized classifier copy (use-/get- helpers below)
StudentImportCommitResult // discriminated commit Server Action result

classifyStudentImport      // pure shared classifier — classify.ts
parseStudentImportFile     // SheetJS read → rows (client) — parse.ts
exportStudents             // roster → CSV/XLSX download (client) — export.ts
downloadStudentTemplate    // template download (client) — template.ts
commitStudentImportAction  // server: re-validate + atomic upsert — actions.ts

useStudentImportMessages   // client — import-export/use-student-import-messages.ts
getImportMessages          // server — import-export/actions.ts (local)
```

## Reading fluency / sessions (Phase 10)

The student reading-session workflow & history lives in `features/reading/sessions/`. Names:

```
ReadingSessionRecord            // a row of reading_sessions (locked schema)
ReadablePassage                 // a passage + precomputed Arabic word_count (student reader)
ReadingSessionView              // a completed session resolved for the history list
ReadingHistory                  // history list + progress summary
ReadingSessionsData             // discriminated page data ({ linked:false } | linked+data)
CompleteReadingSessionFormValues // the session-completion form (passage_id, duration_seconds, errors)
CompleteReadingSessionMessages   // localized schema copy

countWords / computeFluency        // pure WPM/accuracy formulas — fluency.ts
buildCompleteReadingSessionSchema  // message-injected Zod factory — schemas.ts
getReadablePassages / getReadingSessionsData / getLinkedStudentId // server reads — queries.ts
completeReadingSessionAction       // server: recompute + insert (session client only) — actions.ts
```

`useReadingStore` remains reserved (naming-convention) but is intentionally **not** built in
Phase 10: the in-progress session state is page-local and ephemeral, so a global store would be
over-engineering. Introduce it when reading state genuinely spans routes (e.g. the Phase 11 reader).

If a later phase needs something not listed here, derive it by following the same pattern
(e.g. `<Entity>Record`, `use<Domain>Store`) rather than picking an arbitrary name, and add it to
this file once decided so it stays the single source of truth.
