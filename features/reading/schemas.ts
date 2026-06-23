import { z } from "zod";

/**
 * Zod schemas for the Phase 8 reading-content forms (passages & vocabulary).
 *
 * Same convention as `features/auth/schemas.ts` and `features/students/schemas.ts`:
 * localized messages are passed in per build call (pure, concurrency-safe), and
 * the same factory backs both client validation and the server-side
 * re-validation inside the Server Actions, so the two can never drift.
 *
 * Schemas validate but deliberately do **not** transform — both input and output
 * keep the all-strings form shape so `zodResolver`/`react-hook-form` stay typed.
 * The string→number / blank→`null` conversion happens explicitly in the action.
 */

/**
 * Length caps. Data-integrity bounds to reject absurd/accidental input, not
 * business rules — `content` is generous enough for a long reading passage while
 * still preventing accidental extremely large submissions. There is deliberately
 * **no** range on `difficulty_level` / `estimated_minutes`: the schema documents
 * them only as integers, so each is validated as a positive whole number with no
 * upper bound.
 */
export const TITLE_MAX = 200;
export const CONTENT_MAX = 20000;
export const WORD_MAX = 100;
export const MEANING_MAX = 500;

/** Pre-formatted, localized messages the schemas need. */
export type ReadingSchemaMessages = {
  required: string;
  /** Already interpolated with `TITLE_MAX`. */
  titleTooLong: string;
  /** Already interpolated with `CONTENT_MAX`. */
  contentTooLong: string;
  /** Already interpolated with `WORD_MAX`. */
  wordTooLong: string;
  /** Already interpolated with `MEANING_MAX`. */
  meaningTooLong: string;
  /** A numeric field must be a whole number (digits only). */
  wholeNumber: string;
  /** A numeric field must be greater than zero. */
  positive: string;
};

/** A trimmed, required text field with a maximum length. */
function requiredText(required: string, tooLong: string, max: number) {
  return z
    .string({ error: required })
    .trim()
    .min(1, { error: required })
    .max(max, { error: tooLong });
}

/** An optional text field: trimmed and length-capped (blank is allowed). */
function optionalText(tooLong: string, max: number) {
  return z.string().trim().max(max, { error: tooLong });
}

/**
 * A required positive whole number from a string input (digits only, greater
 * than zero) — a data-integrity check with no assumed upper bound. Stays a
 * string here; the action converts it.
 */
function positiveWholeNumber(m: ReadingSchemaMessages) {
  return z
    .string({ error: m.required })
    .trim()
    .min(1, { error: m.required })
    .refine((value) => /^\d+$/.test(value), { error: m.wholeNumber })
    .refine((value) => Number(value) >= 1, { error: m.positive });
}

// ---------------------------------------------------------------------------
// Passages
// ---------------------------------------------------------------------------

function passageFields(m: ReadingSchemaMessages) {
  return {
    title_ar: requiredText(m.required, m.titleTooLong, TITLE_MAX),
    title_en: optionalText(m.titleTooLong, TITLE_MAX),
    content_ar: requiredText(m.required, m.contentTooLong, CONTENT_MAX),
    content_en: optionalText(m.contentTooLong, CONTENT_MAX),
    difficulty_level: positiveWholeNumber(m),
    estimated_minutes: positiveWholeNumber(m),
  };
}

export function buildCreatePassageSchema(m: ReadingSchemaMessages) {
  return z.object(passageFields(m));
}

export function buildUpdatePassageSchema(m: ReadingSchemaMessages) {
  return z.object(passageFields(m));
}

// ---------------------------------------------------------------------------
// Vocabulary terms
// ---------------------------------------------------------------------------

function vocabularyFields(m: ReadingSchemaMessages) {
  return {
    // The passage the term belongs to (required — terms are always scoped).
    passage_id: z
      .string({ error: m.required })
      .trim()
      .min(1, { error: m.required }),
    word_ar: requiredText(m.required, m.wordTooLong, WORD_MAX),
    word_en: optionalText(m.wordTooLong, WORD_MAX),
    meaning_ar: requiredText(m.required, m.meaningTooLong, MEANING_MAX),
    meaning_en: optionalText(m.meaningTooLong, MEANING_MAX),
  };
}

export function buildCreateVocabularyTermSchema(m: ReadingSchemaMessages) {
  return z.object(vocabularyFields(m));
}

export function buildUpdateVocabularyTermSchema(m: ReadingSchemaMessages) {
  return z.object(vocabularyFields(m));
}
