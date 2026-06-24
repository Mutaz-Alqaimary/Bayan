/**
 * Reading-fluency word count & metric formulas (Phase 10).
 *
 * Pure and framework-agnostic — the single source of truth for how speed and
 * accuracy are derived, used by both the client preview and the server-side
 * recompute at commit (so they can never disagree). Documented so a teacher
 * could sanity-check the numbers (DoD requirement).
 *
 * Given a passage word count `W`, a measured reading time `D` (seconds), and the
 * student's self-reported miscued-word count `E`:
 *
 *   words_per_minute    = round( W × 60 / D )         // reading speed
 *   accuracy_percentage = round( (W − E) / W × 100 )  // 0–100
 *
 * Speed and accuracy are kept as independent axes (total words per minute, not
 * words-correct-per-minute) so they match how the dashboards treat avgWpm and
 * avgAccuracy.
 */

/** Count words as Unicode-aware whitespace-separated tokens. */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (trimmed === "") return 0;
  return trimmed.split(/\s+/u).length;
}

export type FluencyInputs = {
  /** Passage word count `W` (from `countWords`). */
  wordCount: number;
  /** Measured reading time `D` in seconds. */
  durationSeconds: number;
  /** Self-reported miscued-word count `E`. */
  errors: number;
};

export type FluencyMetrics = {
  wordsPerMinute: number;
  accuracyPercentage: number;
};

/**
 * Compute the stored metrics from the measured inputs. `errors` is clamped to
 * `[0, wordCount]` defensively; degenerate inputs (zero words or zero duration)
 * yield `0` rather than `Infinity`/`NaN`.
 */
export function computeFluency({
  wordCount,
  durationSeconds,
  errors,
}: FluencyInputs): FluencyMetrics {
  const safeErrors = Math.min(Math.max(errors, 0), wordCount);
  const minutes = durationSeconds / 60;

  const wordsPerMinute =
    minutes > 0 ? Math.round(wordCount / minutes) : 0;
  const accuracyPercentage =
    wordCount > 0
      ? Math.round(((wordCount - safeErrors) / wordCount) * 100)
      : 0;

  return { wordsPerMinute, accuracyPercentage };
}
