/**
 * Shared shape for safe, localized, user-facing error copy, plus the pure
 * builder that turns a next-intl translator into it. Split from the
 * client/server entry points for the same reason as `lib/validation/types.ts`.
 *
 * These are deliberately generic ("Something went wrong", "Connection
 * problem") rather than surfacing raw error messages — per
 * `.claude/rules/code-quality.md`, no technical jargon or stack traces reach
 * the user. Feature code maps a caught error to one of these categories and
 * renders the result via `ErrorState` or `toast()`.
 */

export type ErrorMessages = {
  tryAgain: string;
  generic: { title: string; description: string };
  network: { title: string; description: string };
  unauthorized: { title: string; description: string };
  forbidden: { title: string; description: string };
};

type ErrorsTranslator = (
  key:
    | "tryAgain"
    | "generic.title"
    | "generic.description"
    | "network.title"
    | "network.description"
    | "unauthorized.title"
    | "unauthorized.description"
    | "forbidden.title"
    | "forbidden.description",
) => string;

export function buildErrorMessages(t: ErrorsTranslator): ErrorMessages {
  return {
    tryAgain: t("tryAgain"),
    generic: { title: t("generic.title"), description: t("generic.description") },
    network: { title: t("network.title"), description: t("network.description") },
    unauthorized: {
      title: t("unauthorized.title"),
      description: t("unauthorized.description"),
    },
    forbidden: { title: t("forbidden.title"), description: t("forbidden.description") },
  };
}
