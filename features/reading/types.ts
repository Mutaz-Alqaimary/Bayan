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
