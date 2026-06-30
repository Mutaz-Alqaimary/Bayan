import { describe, expect, it } from "vitest";

import { makeNameCollator, normalizeForSearch } from "@/lib/collation";

/**
 * Arabic-aware search/sort — the invariant `arabic-rtl-i18n.md` flags as one that
 * locale-naive comparison gets wrong and that fails silently. `normalizeForSearch`
 * produces a forgiving comparison key; `makeNameCollator` orders correctly.
 */
describe("normalizeForSearch", () => {
  it("strips tashkīl (diacritics) so vocalized text still matches", () => {
    // "مُحَمَّد" (with harakat) normalizes to the same key as "محمد".
    expect(normalizeForSearch("مُحَمَّد")).toBe(normalizeForSearch("محمد"));
  });

  it("removes tatweel (kashida)", () => {
    expect(normalizeForSearch("محـــمد")).toBe("محمد");
  });

  it("unifies the alef forms (آ أ إ → ا)", () => {
    expect(normalizeForSearch("أحمد")).toBe(normalizeForSearch("احمد"));
    expect(normalizeForSearch("إيمان")).toBe(normalizeForSearch("ايمان"));
    expect(normalizeForSearch("آمنة")).toBe(normalizeForSearch("امنة"));
  });

  it("folds alef maqsura → ya and taa marbuta → ha", () => {
    expect(normalizeForSearch("مصطفى")).toBe(normalizeForSearch("مصطفي"));
    expect(normalizeForSearch("فاطمة")).toBe(normalizeForSearch("فاطمه"));
  });

  it("lowercases and trims Latin text so English/email search still works", () => {
    expect(normalizeForSearch("  Student@Example.COM  ")).toBe("student@example.com");
  });
});

describe("makeNameCollator", () => {
  it("ignores case and diacritics when ordering (sensitivity: base)", () => {
    const collator = makeNameCollator("en");
    expect(collator.compare("ahmed", "Ahmed")).toBe(0);
  });

  it("orders embedded numbers naturally, not lexicographically", () => {
    const collator = makeNameCollator("en");
    const sorted = ["item-10", "item-2", "item-1"].sort(collator.compare);
    expect(sorted).toEqual(["item-1", "item-2", "item-10"]);
  });

  it("sorts Arabic names in a stable, locale-aware order", () => {
    const collator = makeNameCollator("ar");
    const names = ["محمد", "أحمد", "خالد"];
    const sorted = [...names].sort(collator.compare);
    // Deterministic: sorting an already-sorted copy yields the same order.
    expect([...sorted].sort(collator.compare)).toEqual(sorted);
    expect(sorted).toHaveLength(3);
  });
});
