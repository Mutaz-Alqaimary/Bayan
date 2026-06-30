import { describe, expect, it } from "vitest";

import { studentDisplayName } from "@/features/students/types";

/**
 * Bilingual display: the active locale selects the English name only when both
 * English parts exist, otherwise the always-present Arabic name is shown. This is
 * rendered in every roster table, dashboard, and analytics card.
 */
const student = {
  first_name_ar: "محمد",
  last_name_ar: "علي",
  first_name_en: "Mohammed",
  last_name_en: "Ali",
};

describe("studentDisplayName", () => {
  it("shows the English name in the English locale when both parts exist", () => {
    expect(studentDisplayName(student, "en")).toBe("Mohammed Ali");
  });

  it("shows the Arabic name in the Arabic locale", () => {
    expect(studentDisplayName(student, "ar")).toBe("محمد علي");
  });

  it("falls back to Arabic in the English locale when an English part is missing", () => {
    expect(
      studentDisplayName({ ...student, last_name_en: null }, "en"),
    ).toBe("محمد علي");
    expect(
      studentDisplayName({ ...student, first_name_en: null }, "en"),
    ).toBe("محمد علي");
  });
});
