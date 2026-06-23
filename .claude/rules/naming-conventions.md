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

If a later phase needs something not listed here, derive it by following the same pattern
(e.g. `<Entity>Record`, `use<Domain>Store`) rather than picking an arbitrary name, and add it to
this file once decided so it stays the single source of truth.
