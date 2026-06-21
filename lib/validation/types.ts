/**
 * Shared shape for localized Zod validation copy, plus the pure builder that
 * turns a next-intl translator into it. Kept framework-agnostic (no
 * `next-intl` client/server imports) so it can back both the client hook
 * (`useValidationMessages`) and the server helper (`getValidationMessages`)
 * without pulling either's runtime into the other's bundle.
 *
 * Deliberately *not* wired through Zod's global `z.config()`/error-map
 * mechanism: that mutates shared module state, which is unsafe under Next.js
 * concurrent, multi-locale requests in the same process. Schemas instead take
 * these messages per call (e.g. `z.string().min(1, { error: messages.required() })`),
 * which is per-invocation and therefore concurrency-safe.
 */

export type ValidationMessages = {
  required: () => string;
  invalidType: () => string;
  invalidEmail: () => string;
  tooShort: (min: number) => string;
  tooLong: (max: number) => string;
};

type ValidationTranslator = (
  key: "required" | "invalidType" | "invalidEmail" | "tooShort" | "tooLong",
  values?: Record<string, number>,
) => string;

export function buildValidationMessages(t: ValidationTranslator): ValidationMessages {
  return {
    required: () => t("required"),
    invalidType: () => t("invalidType"),
    invalidEmail: () => t("invalidEmail"),
    tooShort: (min) => t("tooShort", { min }),
    tooLong: (max) => t("tooLong", { max }),
  };
}
