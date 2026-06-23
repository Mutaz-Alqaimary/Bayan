"use server";

import { getLocale, getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/features/auth/guards";
import {
  classifyStudentImport,
  toExistingSnapshot,
} from "@/features/students/import-export/classify";
import type {
  RawStudentImportRow,
  StudentImportCommitResult,
  StudentImportMessages,
  StudentImportRow,
  StudentImportRowOutcome,
} from "@/features/students/import-export/types";
import { getStudents } from "@/features/students/queries";
import {
  NAME_MAX,
  NUMBER_MAX,
  type StudentSchemaMessages,
} from "@/features/students/schemas";
import { ROUTES } from "@/lib/routes";
import { supabaseServerClient } from "@/lib/supabase/server";
import { getValidationMessages } from "@/lib/validation/server";

/**
 * Commit a student import (Phase 9).
 *
 * The client preview is advisory only. This action re-fetches the current
 * roster, **re-validates and re-classifies every submitted row server-side**
 * (Server Functions are reachable via direct POST — never trust the client),
 * and writes in a **single atomic upsert** keyed on the existing
 * `student_number` unique constraint. If re-classification rejects any row,
 * nothing is written — there are no partial imports.
 *
 * Roster-only: writes the eight editable columns and never `profile_id`,
 * matching Phase 7 and the locked schema.
 */

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

function toWritePayload(values: StudentImportRow): StudentWritePayload {
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

async function getImportMessages(): Promise<StudentImportMessages> {
  const t = await getTranslations("students.importExport.reject");
  return {
    duplicateNumberInFile: t("duplicateNumberInFile"),
    duplicateEmailInFile: t("duplicateEmailInFile"),
    emailTakenByOther: t("emailTakenByOther"),
  };
}

async function genericError(): Promise<{ title: string; description: string }> {
  const t = await getTranslations("errors");
  return { title: t("generic.title"), description: t("generic.description") };
}

/** Revalidate the roster page for the active locale so the list refreshes. */
async function revalidateStudents(): Promise<void> {
  const locale = await getLocale();
  revalidatePath(`/${locale}${ROUTES.students}`);
}

/** Map a write error to localized copy (mirrors the Phase 7 unique handling). */
async function mapWriteError(
  error: WriteError,
): Promise<{ title: string; description: string }> {
  if (error.code === "23505") {
    const t = await getTranslations("students.errors");
    const haystack = `${error.details ?? ""} ${error.message ?? ""}`.toLowerCase();
    if (haystack.includes("student_number") || haystack.includes("email")) {
      return { title: t("duplicate.title"), description: t("duplicate.description") };
    }
  }
  return genericError();
}

export async function commitStudentImportAction(
  rows: RawStudentImportRow[],
): Promise<StudentImportCommitResult> {
  await requireRole("admin", "teacher");

  if (!Array.isArray(rows) || rows.length === 0) {
    return { ok: false, error: await genericError() };
  }

  const existing = await getStudents();
  const preview = classifyStudentImport({
    rows,
    existing: existing.map(toExistingSnapshot),
    schemaMessages: await getStudentSchemaMessages(),
    importMessages: await getImportMessages(),
  });

  const rejects = preview.outcomes.filter(
    (outcome): outcome is StudentImportRowOutcome =>
      outcome.classification === "reject",
  );
  if (rejects.length > 0) {
    const t = await getTranslations("students.importExport.commit");
    return {
      ok: false,
      error: { title: t("rejectedTitle"), description: t("rejectedDescription") },
      rejects,
    };
  }

  const writable = preview.outcomes.filter(
    (outcome) =>
      outcome.classification === "create" ||
      outcome.classification === "update",
  );
  const created = writable.filter((o) => o.classification === "create").length;
  const updated = writable.filter((o) => o.classification === "update").length;

  if (writable.length === 0) {
    // Everything was unchanged (skip) — nothing to write, but not a failure.
    return { ok: true, created: 0, updated: 0 };
  }

  const supabase = await supabaseServerClient();
  const { error } = await supabase
    .from("students")
    .upsert(writable.map((outcome) => toWritePayload(outcome.values)), {
      onConflict: "student_number",
    });

  if (error) {
    return { ok: false, error: await mapWriteError(error) };
  }

  await revalidateStudents();
  return { ok: true, created, updated };
}
