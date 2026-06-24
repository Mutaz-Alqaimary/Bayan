import { z } from "zod";

/**
 * Zod schema for completing a reading session (Phase 10).
 *
 * Same message-injected pattern as the other features: localized copy is passed
 * in per build call (pure, concurrency-safe). This factory is the **server-side
 * re-validation contract** in the Server Action. The client doesn't re-run it
 * because the UI enforces the same bounds structurally — `duration_seconds` is a
 * measured timer (always ≥ 1s) and `errors` is a stepper clamped to
 * `[0, wordCount]` — so no invalid value can reach the action from the form; the
 * server still re-validates because Server Functions are reachable via direct POST.
 *
 * Validates the *measured inputs only* (`passage_id`, `duration_seconds`,
 * `errors`); the speed/accuracy metrics are recomputed server-side from the
 * passage's own word count, never accepted from the client. The schema does not
 * transform — values stay all-strings.
 */

/** Sanity bound: a single reading session can't run longer than 6 hours. */
export const DURATION_MAX_SECONDS = 6 * 60 * 60;

/** Pre-formatted, localized messages the schema needs. */
export type CompleteReadingSessionMessages = {
  required: string;
  /** A numeric field must be a whole number (digits only). */
  wholeNumber: string;
  /** Duration must be greater than zero. */
  positive: string;
  /** Already interpolated with `DURATION_MAX_SECONDS`. */
  durationTooLong: string;
};

function readingSessionFields(m: CompleteReadingSessionMessages) {
  return {
    // The passage being read (required — a session is always tied to one).
    passage_id: z
      .string({ error: m.required })
      .trim()
      .min(1, { error: m.required }),
    // Measured elapsed reading time, a positive whole number of seconds.
    duration_seconds: z
      .string({ error: m.required })
      .trim()
      .min(1, { error: m.required })
      .refine((value) => /^\d+$/.test(value), { error: m.wholeNumber })
      .refine((value) => Number(value) >= 1, { error: m.positive })
      .refine((value) => Number(value) <= DURATION_MAX_SECONDS, {
        error: m.durationTooLong,
      }),
    // Self-reported miscued words — a non-negative whole number (0 is valid).
    // The upper bound (≤ passage word count) is enforced in the action, which
    // is the only place the word count is known authoritatively.
    errors: z
      .string({ error: m.required })
      .trim()
      .min(1, { error: m.required })
      .refine((value) => /^\d+$/.test(value), { error: m.wholeNumber }),
  };
}

export function buildCompleteReadingSessionSchema(
  m: CompleteReadingSessionMessages,
) {
  return z.object(readingSessionFields(m));
}
