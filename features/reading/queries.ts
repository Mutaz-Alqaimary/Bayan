import "server-only";

import { requireRole } from "@/features/auth/guards";
import type {
  PassageOption,
  ReadingPassageRecord,
  VocabularyTermRecord,
} from "@/features/reading/types";
import { supabaseServerClient } from "@/lib/supabase/server";

/**
 * Server-only typed reads for reading content (passages & vocabulary).
 *
 * Gated to admin and teacher via `requireRole` (data-layer enforcement —
 * `canManageContent`), matching `.claude/rules/architecture.md`. Reads run under
 * the request's session client (RLS-respecting), consistent with Phase 6/7.
 *
 * Search, sorting, filtering, and pagination are performed client-side by the
 * TanStack tables so Arabic collation is correct (see `lib/collation.ts`); a
 * school-sized content library is well within the size where loading it in one
 * query is appropriate.
 */

const PASSAGE_COLUMNS =
  "id, title_ar, title_en, content_ar, content_en, difficulty_level, estimated_minutes, created_at, updated_at";

const VOCABULARY_COLUMNS =
  "id, passage_id, word_ar, word_en, meaning_ar, meaning_en, created_at";

/** All reading passages, newest first. */
export async function getPassages(): Promise<ReadingPassageRecord[]> {
  await requireRole("admin", "teacher");
  const supabase = await supabaseServerClient();

  const { data, error } = await supabase
    .from("reading_passages")
    .select(PASSAGE_COLUMNS)
    .order("created_at", { ascending: false })
    .returns<ReadingPassageRecord[]>();

  if (error) {
    throw new Error(`Failed to load passages: ${error.message}`);
  }

  return data ?? [];
}

/** All vocabulary terms across every passage, newest first. */
export async function getVocabularyTerms(): Promise<VocabularyTermRecord[]> {
  await requireRole("admin", "teacher");
  const supabase = await supabaseServerClient();

  const { data, error } = await supabase
    .from("vocabulary_terms")
    .select(VOCABULARY_COLUMNS)
    .order("created_at", { ascending: false })
    .returns<VocabularyTermRecord[]>();

  if (error) {
    throw new Error(`Failed to load vocabulary terms: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Passages reduced to the fields the vocabulary passage selector/filter needs.
 * Ordered by Arabic title at the DB level only as a stable default; the client
 * re-sorts with a locale collator where it matters.
 */
export async function getPassageOptions(): Promise<PassageOption[]> {
  await requireRole("admin", "teacher");
  const supabase = await supabaseServerClient();

  const { data, error } = await supabase
    .from("reading_passages")
    .select("id, title_ar, title_en")
    .order("title_ar", { ascending: true })
    .returns<PassageOption[]>();

  if (error) {
    throw new Error(`Failed to load passage options: ${error.message}`);
  }

  return data ?? [];
}
