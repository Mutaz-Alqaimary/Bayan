"use server";

import { getLocale, getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/features/auth/guards";
import {
  buildCreatePassageSchema,
  buildCreateVocabularyTermSchema,
  buildUpdatePassageSchema,
  buildUpdateVocabularyTermSchema,
  CONTENT_MAX,
  MEANING_MAX,
  TITLE_MAX,
  WORD_MAX,
  type ReadingSchemaMessages,
} from "@/features/reading/schemas";
import type {
  CreatePassageFormValues,
  CreateVocabularyTermFormValues,
  UpdatePassageFormValues,
  UpdateVocabularyTermFormValues,
} from "@/features/reading/types";
import { ROUTES } from "@/lib/routes";
import { supabaseServerClient } from "@/lib/supabase/server";
import { getValidationMessages } from "@/lib/validation/server";

/**
 * Reading-content CRUD Server Actions (Phase 8) — passages & vocabulary.
 *
 * Every action re-validates input with the same Zod schema the client used,
 * gates on role at the data layer (`requireRole("admin", "teacher")` —
 * `canManageContent`), maps DB failures to safe localized copy, and revalidates
 * the relevant route on success.
 */

export type ReadingErrorCopy = { title: string; description: string };

export type ReadingActionResult =
  | { ok: true }
  | { ok: false; error: ReadingErrorCopy };

/** Shape of a Supabase/Postgres write error we care about. */
type WriteError = { code?: string; message?: string };

async function getReadingSchemaMessages(): Promise<ReadingSchemaMessages> {
  const validation = await getValidationMessages();
  const t = await getTranslations("reading.validation");
  return {
    required: validation.required(),
    titleTooLong: validation.tooLong(TITLE_MAX),
    contentTooLong: validation.tooLong(CONTENT_MAX),
    wordTooLong: validation.tooLong(WORD_MAX),
    meaningTooLong: validation.tooLong(MEANING_MAX),
    wholeNumber: t("wholeNumber"),
    positive: t("positive"),
  };
}

async function genericError(): Promise<ReadingErrorCopy> {
  const t = await getTranslations("errors");
  return { title: t("generic.title"), description: t("generic.description") };
}

async function revalidate(route: string): Promise<void> {
  const locale = await getLocale();
  revalidatePath(`/${locale}${route}`);
}

// ---------------------------------------------------------------------------
// Passages
// ---------------------------------------------------------------------------

type PassageWritePayload = {
  title_ar: string;
  title_en: string | null;
  content_ar: string;
  content_en: string | null;
  difficulty_level: number;
  estimated_minutes: number;
};

function toPassagePayload(values: CreatePassageFormValues): PassageWritePayload {
  return {
    title_ar: values.title_ar,
    title_en: values.title_en === "" ? null : values.title_en,
    content_ar: values.content_ar,
    content_en: values.content_en === "" ? null : values.content_en,
    difficulty_level: Number(values.difficulty_level),
    estimated_minutes: Number(values.estimated_minutes),
  };
}

export async function createPassageAction(
  values: CreatePassageFormValues,
): Promise<ReadingActionResult> {
  await requireRole("admin", "teacher");

  const schema = buildCreatePassageSchema(await getReadingSchemaMessages());
  const parsed = schema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: await genericError() };
  }

  const supabase = await supabaseServerClient();
  const { error } = await supabase
    .from("reading_passages")
    .insert(toPassagePayload(parsed.data));

  if (error) {
    return { ok: false, error: await genericError() };
  }

  await revalidate(ROUTES.passages);
  return { ok: true };
}

export async function updatePassageAction(
  id: string,
  values: UpdatePassageFormValues,
): Promise<ReadingActionResult> {
  await requireRole("admin", "teacher");

  if (!id) {
    return { ok: false, error: await genericError() };
  }

  const schema = buildUpdatePassageSchema(await getReadingSchemaMessages());
  const parsed = schema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: await genericError() };
  }

  const supabase = await supabaseServerClient();
  const { error } = await supabase
    .from("reading_passages")
    .update(toPassagePayload(parsed.data))
    .eq("id", id);

  if (error) {
    return { ok: false, error: await genericError() };
  }

  await revalidate(ROUTES.passages);
  return { ok: true };
}

export async function deletePassageAction(
  id: string,
): Promise<ReadingActionResult> {
  await requireRole("admin", "teacher");

  if (!id) {
    return { ok: false, error: await genericError() };
  }

  const supabase = await supabaseServerClient();
  const { error } = await supabase
    .from("reading_passages")
    .delete()
    .eq("id", id);

  if (error) {
    return mapPassageDeleteError(error);
  }

  await revalidate(ROUTES.passages);
  return { ok: true };
}

/**
 * The DB is the source of truth for whether a passage is removable: a foreign-key
 * violation (23503) means reading sessions or vocabulary terms still reference
 * it. We attempt the delete and surface a localized "in use" message on 23503
 * rather than pre-checking references in application code.
 */
async function mapPassageDeleteError(
  error: WriteError,
): Promise<ReadingActionResult> {
  if (error.code === "23503") {
    const t = await getTranslations("passages.errors");
    return {
      ok: false,
      error: { title: t("inUse.title"), description: t("inUse.description") },
    };
  }
  return { ok: false, error: await genericError() };
}

// ---------------------------------------------------------------------------
// Vocabulary terms
// ---------------------------------------------------------------------------

type VocabularyWritePayload = {
  passage_id: string;
  word_ar: string;
  word_en: string | null;
  meaning_ar: string;
  meaning_en: string | null;
};

function toVocabularyPayload(
  values: CreateVocabularyTermFormValues,
): VocabularyWritePayload {
  return {
    passage_id: values.passage_id,
    word_ar: values.word_ar,
    word_en: values.word_en === "" ? null : values.word_en,
    meaning_ar: values.meaning_ar,
    meaning_en: values.meaning_en === "" ? null : values.meaning_en,
  };
}

/**
 * Map a vocabulary write error. A foreign-key violation (23503) means the chosen
 * passage no longer exists (e.g. deleted in another session) — surface that
 * specifically rather than a generic failure.
 */
async function mapVocabularyWriteError(
  error: WriteError,
): Promise<ReadingActionResult> {
  if (error.code === "23503") {
    const t = await getTranslations("vocabulary.errors");
    return {
      ok: false,
      error: {
        title: t("missingPassage.title"),
        description: t("missingPassage.description"),
      },
    };
  }
  return { ok: false, error: await genericError() };
}

export async function createVocabularyTermAction(
  values: CreateVocabularyTermFormValues,
): Promise<ReadingActionResult> {
  await requireRole("admin", "teacher");

  const schema = buildCreateVocabularyTermSchema(
    await getReadingSchemaMessages(),
  );
  const parsed = schema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: await genericError() };
  }

  const supabase = await supabaseServerClient();
  const { error } = await supabase
    .from("vocabulary_terms")
    .insert(toVocabularyPayload(parsed.data));

  if (error) {
    return mapVocabularyWriteError(error);
  }

  await revalidate(ROUTES.vocabulary);
  return { ok: true };
}

export async function updateVocabularyTermAction(
  id: string,
  values: UpdateVocabularyTermFormValues,
): Promise<ReadingActionResult> {
  await requireRole("admin", "teacher");

  if (!id) {
    return { ok: false, error: await genericError() };
  }

  const schema = buildUpdateVocabularyTermSchema(
    await getReadingSchemaMessages(),
  );
  const parsed = schema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: await genericError() };
  }

  const supabase = await supabaseServerClient();
  const { error } = await supabase
    .from("vocabulary_terms")
    .update(toVocabularyPayload(parsed.data))
    .eq("id", id);

  if (error) {
    return mapVocabularyWriteError(error);
  }

  await revalidate(ROUTES.vocabulary);
  return { ok: true };
}

export async function deleteVocabularyTermAction(
  id: string,
): Promise<ReadingActionResult> {
  await requireRole("admin", "teacher");

  if (!id) {
    return { ok: false, error: await genericError() };
  }

  const supabase = await supabaseServerClient();
  const { error } = await supabase
    .from("vocabulary_terms")
    .delete()
    .eq("id", id);

  if (error) {
    return { ok: false, error: await genericError() };
  }

  await revalidate(ROUTES.vocabulary);
  return { ok: true };
}
