import { z } from "zod";

/**
 * Zod schemas for the Phase 7 student forms (create & update).
 *
 * Mirrors the convention established in `features/auth/schemas.ts`: messages are
 * passed in per build call (not via Zod's global config) so the factories stay
 * pure and concurrency-safe under Next.js's multi-locale concurrent rendering,
 * and the same factory backs both client validation (`useStudentSchemaMessages`)
 * and the server-side re-validation inside the Server Actions
 * (`getStudentSchemaMessages`), so the two can never drift.
 *
 * Return types are left inferred (not annotated as `z.ZodType<…FormValues>`,
 * which would erase the schema's *input* type and break `zodResolver`'s field
 * inference). The schema validates but deliberately does **not** transform: both
 * input and output keep the all-strings `CreateStudentFormValues` shape, so
 * `zodResolver` and `react-hook-form` stay perfectly typed. The string→number
 * (`grade`) and blank→`null` (optional text/date) conversion to the insert
 * payload happens explicitly in the Server Action after a successful parse.
 */

/**
 * Length caps. These are basic data-integrity bounds to reject absurd input,
 * not business rules. There is deliberately **no** grade range (e.g. 1–12): the
 * schema documents `grade` only as an integer, so grade is validated as a
 * positive whole number with no upper bound.
 */
export const NAME_MAX = 100;
export const NUMBER_MAX = 50;

/**
 * Pre-formatted, localized messages the schemas need. Pass already-resolved
 * strings (call the message helpers before building) so the factories stay pure.
 */
export type StudentSchemaMessages = {
  required: string;
  invalidEmail: string;
  /** Already interpolated with `NAME_MAX`. */
  nameTooLong: string;
  /** Already interpolated with `NUMBER_MAX`. */
  numberTooLong: string;
  /** `grade` must be a whole number (digits only). */
  gradeWholeNumber: string;
  /** `grade` must be greater than zero. */
  gradePositive: string;
  invalidDate: string;
  dateInFuture: string;
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
 * `grade` arrives from the form as a string. It must be a positive whole number
 * (digits only, greater than zero) — a data-integrity check on a grade count,
 * with no assumed upper bound. Stays a string here; the action converts it.
 */
function gradeField(m: StudentSchemaMessages) {
  return z
    .string({ error: m.required })
    .trim()
    .min(1, { error: m.required })
    .refine((value) => /^\d+$/.test(value), { error: m.gradeWholeNumber })
    .refine((value) => Number(value) >= 1, { error: m.gradePositive });
}

/**
 * Optional `birth_date` (ISO `YYYY-MM-DD` from a date input). Must be a real
 * date that is not in the future; blank is allowed (the action maps it to null).
 */
function birthDateField(m: StudentSchemaMessages) {
  return z
    .string()
    .trim()
    .refine((value) => value === "" || !Number.isNaN(Date.parse(value)), {
      error: m.invalidDate,
    })
    .refine(
      (value) => {
        if (value === "") return true;
        // Compare date-only ISO strings (`YYYY-MM-DD`) rather than timestamps so
        // the check is timezone-stable: `new Date("YYYY-MM-DD")` is UTC midnight,
        // which can read as "tomorrow" against a local clock near midnight.
        const todayIso = new Date().toLocaleDateString("en-CA");
        return value <= todayIso;
      },
      { error: m.dateInFuture },
    );
}

function studentFields(m: StudentSchemaMessages) {
  return {
    student_number: requiredText(m.required, m.numberTooLong, NUMBER_MAX),
    first_name_ar: requiredText(m.required, m.nameTooLong, NAME_MAX),
    last_name_ar: requiredText(m.required, m.nameTooLong, NAME_MAX),
    first_name_en: optionalText(m.nameTooLong, NAME_MAX),
    last_name_en: optionalText(m.nameTooLong, NAME_MAX),
    email: z
      .string({ error: m.required })
      .trim()
      .min(1, { error: m.required })
      .pipe(z.email({ error: m.invalidEmail })),
    grade: gradeField(m),
    birth_date: birthDateField(m),
  };
}

export function buildCreateStudentSchema(m: StudentSchemaMessages) {
  return z.object(studentFields(m));
}

/** Update validates the same editable fields; the id is handled separately. */
export function buildUpdateStudentSchema(m: StudentSchemaMessages) {
  return z.object(studentFields(m));
}
