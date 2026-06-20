# Phase 8 — Reading Content Management

## Goal
CRUD for `reading_passages` and `vocabulary_terms`.

## Build
- Passage CRUD
- Vocabulary CRUD
- Search
- Filters
- Pagination
- Sorting
- Validation (Zod, localized)

## Definition of done
- Passage forms handle bilingual fields (`title_ar`/`title_en`, `content_ar`/`content_en`)
  clearly, with Arabic as the primary field.
- Vocabulary terms are correctly scoped to their `passage_id`.
- "No passages found" / "no vocabulary found" empty states match the design system, with a
  clear next action (e.g. "Create your first passage").
