import { z } from "zod";

/**
 * Zod schemas for the Phase 5 auth forms.
 *
 * Return types are intentionally left inferred (not annotated as
 * `z.ZodType<…FormValues>`, which would erase the schema's *input* type to
 * `unknown` and break `zodResolver`'s field inference). Each form parameterizes
 * `useForm<…FormValues>` with its value type, so any drift between a schema and
 * its form-value type surfaces as a type error at that call site.
 *
 * Following the project's validation convention (see `lib/validation/types.ts`),
 * messages are passed in per build call rather than via Zod's global config —
 * that keeps schemas concurrency-safe under Next.js's multi-locale, concurrent
 * rendering. The same factory backs both client validation (built from
 * `useValidationMessages` + the `auth.validation` namespace) and server-side
 * re-validation inside the Server Actions (built from `getValidationMessages` +
 * `getTranslations`), so the two can never drift.
 */

/** Minimum password length enforced on registration and password reset. */
export const PASSWORD_MIN_LENGTH = 8;

/**
 * Pre-formatted, localized messages the schemas need. Pass already-resolved
 * strings (call the message helpers before building) so the factories stay pure
 * and side-effect free.
 */
export type AuthSchemaMessages = {
  required: string;
  invalidEmail: string;
  /** Already interpolated with `PASSWORD_MIN_LENGTH`. */
  passwordTooShort: string;
  passwordMismatch: string;
};

/** A trimmed, required, well-formed email field. */
function emailField(m: AuthSchemaMessages) {
  return z
    .string({ error: m.required })
    .trim()
    .min(1, { error: m.required })
    .pipe(z.email({ error: m.invalidEmail }));
}

export function buildLoginSchema(m: AuthSchemaMessages) {
  return z.object({
    email: emailField(m),
    // Login only checks that a password was entered — length rules apply at
    // registration, not here.
    password: z.string({ error: m.required }).min(1, { error: m.required }),
  });
}

export function buildRegisterSchema(m: AuthSchemaMessages) {
  return z
    .object({
      fullName: z
        .string({ error: m.required })
        .trim()
        .min(1, { error: m.required }),
      email: emailField(m),
      password: z
        .string({ error: m.required })
        .min(PASSWORD_MIN_LENGTH, { error: m.passwordTooShort }),
      confirmPassword: z
        .string({ error: m.required })
        .min(1, { error: m.required }),
    })
    .refine((values) => values.password === values.confirmPassword, {
      error: m.passwordMismatch,
      path: ["confirmPassword"],
    });
}

export function buildForgotPasswordSchema(m: AuthSchemaMessages) {
  return z.object({
    email: emailField(m),
  });
}

export function buildResetPasswordSchema(m: AuthSchemaMessages) {
  return z
    .object({
      password: z
        .string({ error: m.required })
        .min(PASSWORD_MIN_LENGTH, { error: m.passwordTooShort }),
      confirmPassword: z
        .string({ error: m.required })
        .min(1, { error: m.required }),
    })
    .refine((values) => values.password === values.confirmPassword, {
      error: m.passwordMismatch,
      path: ["confirmPassword"],
    });
}
