import { describe, expect, it } from "vitest";

import { deriveReadingInsights } from "@/features/analytics/reading/insights";
import type { ReadingInsightKind } from "@/features/analytics/reading/types";

/**
 * The reading-insights engine encodes the teacher-facing "is this reader
 * improving?" rules (spec §5). Tests pin which `kind` fires for which metric
 * shape, and the structural invariants (each kind at most once; ordered).
 */
function kinds(input: Parameters<typeof deriveReadingInsights>[0]): ReadingInsightKind[] {
  return deriveReadingInsights(input).map((i) => i.kind);
}

describe("deriveReadingInsights", () => {
  it("flags too little history below the session floor", () => {
    const result = deriveReadingInsights({
      wpmValues: [100, 110],
      accuracyValues: [95, 96],
      avgAccuracy: 95.5,
      sessionsCount: 2,
    });
    expect(result.map((i) => i.kind)).toEqual(["needs_more_data"]);
    expect(result[0].values).toEqual({ sessions: 2 });
  });

  it("still surfaces low accuracy even with little history", () => {
    expect(
      kinds({
        wpmValues: [50, 55],
        accuracyValues: [60, 62],
        avgAccuracy: 61,
        sessionsCount: 2,
      }),
    ).toEqual(["needs_more_data", "accuracy_low"]);
  });

  it("detects improving speed and accuracy across the period", () => {
    const result = kinds({
      // earlier half avg 60, later half avg 100 → +40 wpm (≥5)
      wpmValues: [60, 60, 100, 100],
      // earlier half avg 80, later half avg 95 → +15 pts (≥3)
      accuracyValues: [80, 80, 95, 95],
      avgAccuracy: 87.5,
      sessionsCount: 4,
    });
    expect(result).toContain("wpm_improving");
    expect(result).toContain("accuracy_improving");
  });

  it("detects declining speed and accuracy", () => {
    const result = kinds({
      wpmValues: [120, 120, 80, 80], // -40 wpm
      accuracyValues: [98, 98, 90, 90], // -8 pts
      avgAccuracy: 94,
      sessionsCount: 4,
    });
    expect(result).toContain("wpm_declining");
    expect(result).toContain("accuracy_declining");
  });

  it("flags a low average accuracy as at-risk", () => {
    expect(
      kinds({
        wpmValues: [90, 90, 90, 90],
        accuracyValues: [78, 78, 79, 79],
        avgAccuracy: 78.5,
        sessionsCount: 4,
      }),
    ).toContain("accuracy_low");
  });

  it("affirms steady progress when nothing notable surfaced", () => {
    expect(
      kinds({
        wpmValues: [100, 100, 101, 101], // negligible change
        accuracyValues: [95, 95, 96, 96], // negligible change
        avgAccuracy: 95.5,
        sessionsCount: 4,
      }),
    ).toEqual(["steady_progress"]);
  });

  it("emits each kind at most once (stable React-key invariant)", () => {
    const result = deriveReadingInsights({
      wpmValues: [60, 60, 100, 100],
      accuracyValues: [70, 70, 60, 60],
      avgAccuracy: 65,
      sessionsCount: 4,
    });
    const seen = result.map((i) => i.kind);
    expect(new Set(seen).size).toBe(seen.length);
    // `id` mirrors `kind` so it is a stable key.
    expect(result.every((i) => i.id === i.kind)).toBe(true);
  });
});
