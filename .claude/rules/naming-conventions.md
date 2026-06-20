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
```

If a later phase needs something not listed here, derive it by following the same pattern
(e.g. `<Entity>Record`, `use<Domain>Store`) rather than picking an arbitrary name, and add it to
this file once decided so it stays the single source of truth.
