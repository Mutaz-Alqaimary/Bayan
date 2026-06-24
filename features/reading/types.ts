/**
 * Reading-content domain types (passages and vocabulary).
 *
 * `ReadingPassageRecord` and `VocabularyTermRecord` are the hand-authored domain
 * types for the `reading_passages` and `vocabulary_terms` tables as documented
 * in `.claude/rules/database-schema.md`. Once Supabase CLI-generated database
 * types exist (see SupabaseArchitecture.md) these should be derived from them.
 * Generated types are never hand-written.
 *
 * Created in Phase 6 (dashboard reads); the reading-content feature is built in
 * Phase 8 and will extend this module.
 */

/** A row of the `reading_passages` table. */
export type ReadingPassageRecord = {
  id: string;
  title_ar: string;
  title_en: string | null;
  content_ar: string;
  content_en: string | null;
  difficulty_level: number;
  estimated_minutes: number;
  created_at: string;
  updated_at: string;
};

/** A row of the `vocabulary_terms` table. */
export type VocabularyTermRecord = {
  id: string;
  passage_id: string;
  word_ar: string;
  word_en: string | null;
  meaning_ar: string;
  meaning_en: string | null;
  created_at: string;
};

/**
 * A passage's title in the active locale, falling back to the Arabic title
 * (always present) when the English title is missing.
 */
export function passageTitle(
  passage: Pick<ReadingPassageRecord, "title_ar" | "title_en">,
  locale: string,
): string {
  if (locale === "en" && passage.title_en) {
    return passage.title_en;
  }
  return passage.title_ar;
}

/**
 * A vocabulary term's word in the active locale, falling back to the Arabic
 * word (always present) when the English word is missing.
 */
export function vocabularyWord(
  term: Pick<VocabularyTermRecord, "word_ar" | "word_en">,
  locale: string,
): string {
  if (locale === "en" && term.word_en) {
    return term.word_en;
  }
  return term.word_ar;
}

/**
 * A vocabulary term's meaning in the active locale, falling back to the Arabic
 * meaning (always present) when the English meaning is missing. Mirrors
 * `vocabularyWord` — used by the Phase 11 reader's vocabulary lookup.
 */
export function vocabularyMeaning(
  term: Pick<VocabularyTermRecord, "meaning_ar" | "meaning_en">,
  locale: string,
): string {
  if (locale === "en" && term.meaning_en) {
    return term.meaning_en;
  }
  return term.meaning_ar;
}

/**
 * Form value types for the Phase 8 reading-content CRUD forms. Names are fixed
 * by `.claude/rules/naming-conventions.md` (which names these explicitly).
 *
 * Every field is a string because that is what the inputs hold (a number input
 * still yields a string, a blank optional field yields `""`). The Zod schemas in
 * `schemas.ts` validate these; the string→number / blank→`null` conversion to
 * the typed insert/update payload happens explicitly in the Server Action, so
 * `react-hook-form` and `zodResolver` stay perfectly typed.
 */
export type CreatePassageFormValues = {
  title_ar: string;
  title_en: string;
  content_ar: string;
  content_en: string;
  difficulty_level: string;
  estimated_minutes: string;
};

/** Same editable fields as create — the id is passed separately to the action. */
export type UpdatePassageFormValues = CreatePassageFormValues;

export type CreateVocabularyTermFormValues = {
  passage_id: string;
  word_ar: string;
  word_en: string;
  meaning_ar: string;
  meaning_en: string;
};

/** Same editable fields as create — the id is passed separately to the action. */
export type UpdateVocabularyTermFormValues = CreateVocabularyTermFormValues;

/** A passage reduced to what the vocabulary passage selector/filter needs. */
export type PassageOption = {
  id: string;
  title_ar: string;
  title_en: string | null;
};
