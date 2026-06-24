"use server";

import { getLocale, getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/features/auth/guards";
import { toNum } from "@/features/dashboard/data/shared";
import { computeFluency, countWords } from "@/features/reading/sessions/fluency";
import { getLinkedStudentId } from "@/features/reading/sessions/queries";
import {
  buildCompleteReadingSessionSchema,
  DURATION_MAX_SECONDS,
  type CompleteReadingSessionMessages,
} from "@/features/reading/sessions/schemas";
import type { CompleteReadingSessionFormValues } from "@/features/reading/sessions/types";
import { ROUTES } from "@/lib/routes";
import { supabaseServerClient } from "@/lib/supabase/server";
import { getValidationMessages } from "@/lib/validation/server";

/**
 * Complete a reading session (Phase 10).
 *
 * Student-only. The client measures duration and self-reports miscues; this
 * action re-validates, recomputes WPM/accuracy from the passage's *own* Arabic
 * word count (never trusting client metrics), resolves the `student_id` from the
 * signed-in user's `profile_id` (the client never supplies it), and inserts one
 * row.
 *
 * Writes go through the **session client only** — no service-role fallback. If
 * the locked RLS blocks the insert, the action surfaces the failure (and logs
 * the exact code) rather than silently escalating privileges.
 *
 * Duplicate protection: a double-click is blocked client-side, and the action
 * additionally refuses to insert a second identical row for the same student
 * within a short window (covers refresh/retry/re-POST).
 */

export type ReadingSessionErrorCopy = { title: string; description: string };

export type ReadingSessionActionResult =
  | { ok: true; duplicate: boolean }
  | { ok: false; error: ReadingSessionErrorCopy };

/** Window within which an identical session is treated as a duplicate re-submit. */
const DUPLICATE_WINDOW_MS = 30_000;

type LatestSessionRow = {
  passage_id: string;
  // PostgREST returns `numeric` columns as strings — kept wide and coerced with
  // `toNum` at the comparison site.
  words_per_minute: number | string | null;
  accuracy_percentage: number | string | null;
  duration_seconds: number | string | null;
  created_at: string;
};

async function getReadingSessionMessages(): Promise<CompleteReadingSessionMessages> {
  const validation = await getValidationMessages();
  const t = await getTranslations("readingSessions.validation");
  return {
    required: validation.required(),
    wholeNumber: t("wholeNumber"),
    positive: t("positive"),
    durationTooLong: t("durationTooLong", { max: DURATION_MAX_SECONDS }),
  };
}

async function copy(
  namespace: "generic" | "notLinked" | "passageMissing" | "errorsExceedWords",
  params?: Record<string, number>,
): Promise<ReadingSessionErrorCopy> {
  if (namespace === "generic") {
    const t = await getTranslations("errors");
    return { title: t("generic.title"), description: t("generic.description") };
  }
  const t = await getTranslations("readingSessions.errors");
  return {
    title: t(`${namespace}.title`),
    description: t(`${namespace}.description`, params),
  };
}

/** Revalidate the pages whose data changes when a session is recorded. */
async function revalidateAfterSession(): Promise<void> {
  const locale = await getLocale();
  revalidatePath(`/${locale}${ROUTES.readingSessions}`);
  revalidatePath(`/${locale}${ROUTES.dashboard}`);
}

export async function completeReadingSessionAction(
  values: CompleteReadingSessionFormValues,
): Promise<ReadingSessionActionResult> {
  const user = await requireRole("student");

  const studentId = await getLinkedStudentId(user.profile.id);
  if (!studentId) {
    return { ok: false, error: await copy("notLinked") };
  }

  const schema = buildCompleteReadingSessionSchema(
    await getReadingSessionMessages(),
  );
  const parsed = schema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: await copy("generic") };
  }

  const supabase = await supabaseServerClient();

  // Recompute from the passage's own content — the authoritative word count.
  const { data: passage, error: passageError } = await supabase
    .from("reading_passages")
    .select("content_ar")
    .eq("id", parsed.data.passage_id)
    .maybeSingle<{ content_ar: string }>();

  if (passageError) {
    return { ok: false, error: await copy("generic") };
  }
  if (!passage) {
    return { ok: false, error: await copy("passageMissing") };
  }

  const wordCount = countWords(passage.content_ar);
  const errors = Number(parsed.data.errors);
  if (errors > wordCount) {
    return {
      ok: false,
      error: await copy("errorsExceedWords", { words: wordCount }),
    };
  }

  const durationSeconds = Number(parsed.data.duration_seconds);
  const { wordsPerMinute, accuracyPercentage } = computeFluency({
    wordCount,
    durationSeconds,
    errors,
  });

  // Duplicate guard: if the student's most recent session is identical and was
  // recorded moments ago, treat this as a re-submit and do not insert again
  // (covers refresh / retry / re-POST; a fast double-click is blocked client
  // side). Numeric columns come back from PostgREST as strings, so both sides
  // are coerced with `toNum` before comparing — matching `accuracy_percentage`
  // (which also pins down `errors` for a fixed word count) is what makes the
  // metrics tuple a reliable identity here.
  //
  // This is a read-then-insert with an inherent (tiny) TOCTOU window: two truly
  // simultaneous POSTs could both pass before either inserts. The locked schema
  // has no unique constraint to lean on (and we must not add one), so the 30s
  // window plus the client guard is the best achievable — good enough for the
  // double-click/refresh/retry cases this protects against.
  const { data: latest, error: latestError } = await supabase
    .from("reading_sessions")
    .select(
      "passage_id, words_per_minute, accuracy_percentage, duration_seconds, created_at",
    )
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<LatestSessionRow>();

  if (latestError) {
    return { ok: false, error: await copy("generic") };
  }
  if (
    latest &&
    latest.passage_id === parsed.data.passage_id &&
    toNum(latest.duration_seconds) === durationSeconds &&
    toNum(latest.words_per_minute) === wordsPerMinute &&
    toNum(latest.accuracy_percentage) === accuracyPercentage &&
    Date.now() - new Date(latest.created_at).getTime() < DUPLICATE_WINDOW_MS
  ) {
    return { ok: true, duplicate: true };
  }

  const { error: insertError } = await supabase.from("reading_sessions").insert({
    student_id: studentId,
    passage_id: parsed.data.passage_id,
    words_per_minute: wordsPerMinute,
    accuracy_percentage: accuracyPercentage,
    duration_seconds: durationSeconds,
    completed_at: new Date().toISOString(),
  });

  if (insertError) {
    // RLS denial: surface as a generic failure and log the exact code — we do
    // NOT silently escalate to the service-role client (Phase 10 constraint).
    if (insertError.code === "42501") {
      console.error(
        "reading_sessions insert blocked by RLS (42501). A student-insert policy is required; not falling back to service role.",
      );
    }
    return { ok: false, error: await copy("generic") };
  }

  await revalidateAfterSession();
  return { ok: true, duplicate: false };
}
