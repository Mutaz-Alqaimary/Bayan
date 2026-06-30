import { describe, expect, it } from "vitest";

import {
  passageTitle,
  vocabularyMeaning,
  vocabularyWord,
} from "@/features/reading/types";

/**
 * Bilingual reading-content accessors: the English value is used only in the
 * English locale when present, otherwise the always-present Arabic value. Mirrors
 * `studentDisplayName`; covers passage titles + vocabulary word/meaning.
 */
describe("passageTitle", () => {
  const passage = { title_ar: "الغابة", title_en: "The Forest" };

  it("uses the English title in the English locale", () => {
    expect(passageTitle(passage, "en")).toBe("The Forest");
  });

  it("uses the Arabic title in the Arabic locale", () => {
    expect(passageTitle(passage, "ar")).toBe("الغابة");
  });

  it("falls back to Arabic when the English title is missing", () => {
    expect(passageTitle({ title_ar: "الغابة", title_en: null }, "en")).toBe("الغابة");
  });
});

describe("vocabularyWord / vocabularyMeaning", () => {
  const term = {
    word_ar: "شجرة",
    word_en: "tree",
    meaning_ar: "نبات كبير",
    meaning_en: "a large plant",
  };

  it("selects per locale with an Arabic fallback", () => {
    expect(vocabularyWord(term, "en")).toBe("tree");
    expect(vocabularyWord(term, "ar")).toBe("شجرة");
    expect(vocabularyWord({ ...term, word_en: null }, "en")).toBe("شجرة");

    expect(vocabularyMeaning(term, "en")).toBe("a large plant");
    expect(vocabularyMeaning(term, "ar")).toBe("نبات كبير");
    expect(vocabularyMeaning({ ...term, meaning_en: null }, "en")).toBe("نبات كبير");
  });
});
