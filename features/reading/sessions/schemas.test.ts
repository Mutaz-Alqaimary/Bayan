import { describe, expect, it } from "vitest";

import {
  buildCompleteReadingSessionSchema,
  DURATION_MAX_SECONDS,
  type CompleteReadingSessionMessages,
} from "@/features/reading/sessions/schemas";

/**
 * The reading-session schema is the server-side re-validation contract for
 * `completeReadingSessionAction` (reachable via direct POST). It validates the
 * measured inputs only; metrics are recomputed server-side.
 */
const m: CompleteReadingSessionMessages = {
  required: "REQUIRED",
  wholeNumber: "WHOLE",
  positive: "POSITIVE",
  durationTooLong: "TOO_LONG",
};
const schema = buildCompleteReadingSessionSchema(m);

function messages(result: { success: boolean; error?: { issues: { message: string }[] } }) {
  return result.success ? [] : (result.error?.issues.map((i) => i.message) ?? []);
}

const valid = { passage_id: "passage-1", duration_seconds: "120", errors: "3" };

describe("buildCompleteReadingSessionSchema", () => {
  it("accepts valid measured inputs (0 errors is valid)", () => {
    expect(schema.safeParse(valid).success).toBe(true);
    expect(schema.safeParse({ ...valid, errors: "0" }).success).toBe(true);
  });

  it("requires a passage id", () => {
    expect(messages(schema.safeParse({ ...valid, passage_id: "" }))).toContain("REQUIRED");
  });

  it("rejects non-numeric duration / errors", () => {
    expect(messages(schema.safeParse({ ...valid, duration_seconds: "12.5" }))).toContain("WHOLE");
    expect(messages(schema.safeParse({ ...valid, errors: "two" }))).toContain("WHOLE");
  });

  it("requires a positive duration", () => {
    expect(messages(schema.safeParse({ ...valid, duration_seconds: "0" }))).toContain("POSITIVE");
  });

  it("rejects a duration beyond the sanity cap", () => {
    expect(
      messages(schema.safeParse({ ...valid, duration_seconds: String(DURATION_MAX_SECONDS + 1) })),
    ).toContain("TOO_LONG");
    expect(schema.safeParse({ ...valid, duration_seconds: String(DURATION_MAX_SECONDS) }).success).toBe(true);
  });
});
