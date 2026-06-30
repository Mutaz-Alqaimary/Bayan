import { describe, expect, it } from "vitest";

import { computeFluency, countWords } from "@/features/reading/sessions/fluency";

/**
 * The reading-fluency formulas are the product's core metric (WPM + accuracy),
 * shared by the client preview and the server-side recompute so they can never
 * disagree. These tests pin the formula and its degenerate-input guards.
 */
describe("countWords", () => {
  it("counts Arabic whitespace-separated tokens", () => {
    expect(countWords("القراءة تحسن مع الوقت")).toBe(4);
  });

  it("collapses runs of whitespace and trims edges", () => {
    expect(countWords("  hello\t\nworld   ")).toBe(2);
    expect(countWords("a  b   c")).toBe(3);
  });

  it("counts mixed Arabic/English content", () => {
    expect(countWords("القراءة reading practice ممارسة")).toBe(4);
  });

  it("returns 0 for empty or whitespace-only text", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("   \n\t ")).toBe(0);
  });
});

describe("computeFluency", () => {
  it("computes WPM and accuracy from clean inputs", () => {
    // 100 words in 60s → 100 wpm; 5 errors of 100 → 95% accuracy.
    expect(
      computeFluency({ wordCount: 100, durationSeconds: 60, errors: 5 }),
    ).toEqual({ wordsPerMinute: 100, accuracyPercentage: 95 });
  });

  it("rounds WPM and accuracy to whole numbers", () => {
    // 50 words in 45s → 66.67 wpm → 67.
    expect(
      computeFluency({ wordCount: 50, durationSeconds: 45, errors: 0 }),
    ).toMatchObject({ wordsPerMinute: 67, accuracyPercentage: 100 });
    // 3 errors of 7 words → 57.14% → 57.
    expect(
      computeFluency({ wordCount: 7, durationSeconds: 60, errors: 3 }),
    ).toMatchObject({ accuracyPercentage: 57 });
  });

  it("guards zero duration (no Infinity)", () => {
    expect(
      computeFluency({ wordCount: 100, durationSeconds: 0, errors: 0 }),
    ).toMatchObject({ wordsPerMinute: 0 });
  });

  it("guards zero words (no NaN)", () => {
    expect(
      computeFluency({ wordCount: 0, durationSeconds: 60, errors: 0 }),
    ).toEqual({ wordsPerMinute: 0, accuracyPercentage: 0 });
  });

  it("clamps errors to [0, wordCount]", () => {
    // Negative errors clamp to 0 → 100% accuracy.
    expect(
      computeFluency({ wordCount: 10, durationSeconds: 60, errors: -5 }),
    ).toMatchObject({ accuracyPercentage: 100 });
    // Errors above wordCount clamp to wordCount → 0% accuracy.
    expect(
      computeFluency({ wordCount: 10, durationSeconds: 60, errors: 999 }),
    ).toMatchObject({ accuracyPercentage: 0 });
  });
});
