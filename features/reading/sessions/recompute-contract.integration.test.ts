import { describe, expect, it } from "vitest";

import { computeFluency, countWords } from "@/features/reading/sessions/fluency";
import {
  buildCompleteReadingSessionSchema,
  type CompleteReadingSessionMessages,
} from "@/features/reading/sessions/schemas";

/**
 * Offline integration: the authoritative recompute path of
 * `completeReadingSessionAction` — validated form input → word count from the
 * passage's own content → fluency metrics, plus the `errors > wordCount` guard.
 * This is the DB-free portion of the action (the read/duplicate-guard/insert wire
 * path is Phase 19). Proves the schema + fluency modules compose into the stored
 * metrics, and that the over-error guard trips.
 */
const m: CompleteReadingSessionMessages = {
  required: "REQUIRED",
  wholeNumber: "WHOLE",
  positive: "POSITIVE",
  durationTooLong: "TOO_LONG",
};
const schema = buildCompleteReadingSessionSchema(m);

// A passage with exactly 10 Arabic word tokens (the authoritative word count).
const PASSAGE = "أ ب ت ث ج ح خ د ذ ر";

/** Mirrors the action's offline computation after a successful parse. */
function recompute(values: { passage_id: string; duration_seconds: string; errors: string }) {
  const parsed = schema.safeParse(values);
  if (!parsed.success) {
    return { ok: false as const, reason: "invalid" as const };
  }
  const wordCount = countWords(PASSAGE);
  const errors = Number(parsed.data.errors);
  if (errors > wordCount) {
    return { ok: false as const, reason: "errors_exceed_words" as const };
  }
  return {
    ok: true as const,
    metrics: computeFluency({
      wordCount,
      durationSeconds: Number(parsed.data.duration_seconds),
      errors,
    }),
  };
}

describe("reading-session recompute contract", () => {
  it("produces the authoritative metrics from validated input", () => {
    // 10 words in 60s → 10 wpm; 2 errors of 10 → 80% accuracy.
    expect(recompute({ passage_id: "p1", duration_seconds: "60", errors: "2" })).toEqual({
      ok: true,
      metrics: { wordsPerMinute: 10, accuracyPercentage: 80 },
    });
  });

  it("recomputes from the passage word count, not any client-supplied metric", () => {
    // 10 words in 30s → 20 wpm; 0 errors → 100%.
    expect(recompute({ passage_id: "p1", duration_seconds: "30", errors: "0" })).toMatchObject({
      ok: true,
      metrics: { wordsPerMinute: 20, accuracyPercentage: 100 },
    });
  });

  it("rejects invalid input before recomputing", () => {
    expect(recompute({ passage_id: "p1", duration_seconds: "0", errors: "1" })).toEqual({
      ok: false,
      reason: "invalid",
    });
    expect(recompute({ passage_id: "", duration_seconds: "60", errors: "1" })).toEqual({
      ok: false,
      reason: "invalid",
    });
  });

  it("trips the over-error guard when errors exceed the passage word count", () => {
    // Schema accepts "15" (a whole number); the word-count guard rejects it.
    expect(recompute({ passage_id: "p1", duration_seconds: "60", errors: "15" })).toEqual({
      ok: false,
      reason: "errors_exceed_words",
    });
  });
});
