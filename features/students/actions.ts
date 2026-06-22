"use server";

import { getLocale, getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/features/auth/guards";
import {
  buildCreateStudentSchema,
  buildUpdateStudentSchema,
  NAME_MAX,
  NUMBER_MAX,
  type StudentSchemaMessages,
} from "@/features/students/schemas";
import type {
  CreateStudentFormValues,
  UpdateStudentFormValues,
} from "@/features/students/types";
import { ROUTES } from "@/lib/routes";
import { supabaseServerClient } from "@/lib/supabase/server";
import { getValidationMessages } from "@/lib/validation/server";

/**
 * Student CRUD Server Actions (Phase 7).
 *
 * Every action re-validates input with the same Zod schema the client used
 * (Server Functions are reachable via direct POST — never trust the client),
 * gates on role at the data layer (`requireRole("admin", "teacher")`), maps DB
 * failures to safe, localized copy, and revalidates the roster route on success.
 *
 * Roster-only: `profile_id` is never written here — Phase 7 does not link
 * students to auth/profile rows.
 */

export type StudentErrorCopy = { title: string; description: string };

/** A duplicate-value error attributable to a specific field. */
export type StudentFieldError = {
  field: "student_number" | "email";
  message: string;
};

/** Discriminated result handed back to the client form. */
export type StudentActionResult =
  | { ok: true }
  | { ok: false; error: StudentErrorCopy; fieldErrors?: StudentFieldError[] };

/** Shape of a Supabase/Postgres write error we care about. */
type WriteError = { code?: string; message?: string; details?: string };

/** The validated, persistable roster payload (DB column shape, no profile_id). */
type StudentWritePayload = {
  student_number: string;
  first_name_ar: string;
  last_name_ar: string;
  first_name_en: string | null;
  last_name_en: string | null;
  email: string;
  grade: number;
  birth_date: string | null;
};

/**
 * Convert the validated all-strings form values into the typed insert/update
 * payload: `grade` → number, and blank optional fields → `null` (matching the
 * nullable columns in `database-schema.md`).
 */
function toWritePayload(values: {
  student_number: string;
  first_name_ar: string;
  last_name_ar: string;
  first_name_en: string;
  last_name_en: string;
  email: string;
  grade: string;
  birth_date: string;
}): StudentWritePayload {
  return {
    student_number: values.student_number,
    first_name_ar: values.first_name_ar,
    last_name_ar: values.last_name_ar,
    first_name_en: values.first_name_en === "" ? null : values.first_name_en,
    last_name_en: values.last_name_en === "" ? null : values.last_name_en,
    email: values.email,
    grade: Number(values.grade),
    birth_date: values.birth_date === "" ? null : values.birth_date,
  };
}

async function getStudentSchemaMessages(): Promise<StudentSchemaMessages> {
  const validation = await getValidationMessages();
  const t = await getTranslations("students.validation");
  return {
    required: validation.required(),
    invalidEmail: validation.invalidEmail(),
    nameTooLong: validation.tooLong(NAME_MAX),
    numberTooLong: validation.tooLong(NUMBER_MAX),
    gradeWholeNumber: t("wholeNumber"),
    gradePositive: t("positive"),
    invalidDate: t("invalidDate"),
    dateInFuture: t("dateInFuture"),
  };
}

async function genericError(): Promise<StudentErrorCopy> {
  const t = await getTranslations("errors");
  return { title: t("generic.title"), description: t("generic.description") };
}

/** Revalidate the roster page for the active locale so the list refreshes. */
async function revalidateStudents(): Promise<void> {
  const locale = await getLocale();
  revalidatePath(`/${locale}${ROUTES.students}`);
}

/**
 * Map a write error to localized copy. A unique-constraint violation (23505) is
 * surfaced as a field-level error on whichever column collided.
 *
 * Classification matches the colliding column name inside the Postgres error
 * text, which holds for the default `students_student_number_key` /
 * `students_email_key` constraint identifiers. An unrecognized constraint
 * degrades safely to the generic error (no field highlight) rather than guessing.
 */
async function mapWriteError(error: WriteError): Promise<StudentActionResult> {
  if (error.code === "23505") {
    const t = await getTranslations("students.errors");
    const haystack = `${error.details ?? ""} ${error.message ?? ""}`.toLowerCase();
    if (haystack.includes("student_number")) {
      return {
        ok: false,
        error: {
          title: t("duplicate.title"),
          description: t("duplicate.description"),
        },
        fieldErrors: [
          { field: "student_number", message: t("duplicateNumber") },
        ],
      };
    }
    if (haystack.includes("email")) {
      return {
        ok: false,
        error: {
          title: t("duplicate.title"),
          description: t("duplicate.description"),
        },
        fieldErrors: [{ field: "email", message: t("duplicateEmail") }],
      };
    }
  }
  return { ok: false, error: await genericError() };
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export async function createStudentAction(
  values: CreateStudentFormValues,
): Promise<StudentActionResult> {
  await requireRole("admin", "teacher");

  const schema = buildCreateStudentSchema(await getStudentSchemaMessages());
  const parsed = schema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: await genericError() };
  }

  const supabase = await supabaseServerClient();
  const { error } = await supabase
    .from("students")
    .insert(toWritePayload(parsed.data));

  if (error) {
    return mapWriteError(error);
  }

  await revalidateStudents();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export async function updateStudentAction(
  id: string,
  values: UpdateStudentFormValues,
): Promise<StudentActionResult> {
  await requireRole("admin", "teacher");

  if (!id) {
    return { ok: false, error: await genericError() };
  }

  const schema = buildUpdateStudentSchema(await getStudentSchemaMessages());
  const parsed = schema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: await genericError() };
  }

  const supabase = await supabaseServerClient();
  const { error } = await supabase
    .from("students")
    .update(toWritePayload(parsed.data))
    .eq("id", id);

  if (error) {
    return mapWriteError(error);
  }

  await revalidateStudents();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

export async function deleteStudentAction(
  id: string,
): Promise<StudentActionResult> {
  await requireRole("admin", "teacher");

  if (!id) {
    return { ok: false, error: await genericError() };
  }

  const supabase = await supabaseServerClient();
  const { error } = await supabase.from("students").delete().eq("id", id);

  if (error) {
    // A foreign-key violation (23503) means reading sessions reference this
    // student — refuse rather than silently destroy reading history.
    if (error.code === "23503") {
      const t = await getTranslations("students.errors");
      return {
        ok: false,
        error: {
          title: t("hasHistory.title"),
          description: t("hasHistory.description"),
        },
      };
    }
    return { ok: false, error: await genericError() };
  }

  await revalidateStudents();
  return { ok: true };
}
