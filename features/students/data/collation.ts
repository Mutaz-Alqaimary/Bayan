/**
 * Arabic-aware collation and search helpers (Phase 7 DoD: search/sort must not
 * be locale-naive). Framework-agnostic — used by the client TanStack table.
 */

/**
 * A locale-aware collator for ordering names. `sensitivity: "base"` ignores
 * case and diacritics; `numeric` orders embedded numbers naturally. This sorts
 * Arabic (and English) correctly, which Postgres' default collation does not
 * reliably do — hence sorting happens here rather than in the query.
 */
export function makeNameCollator(locale: string): Intl.Collator {
  return new Intl.Collator(locale, { sensitivity: "base", numeric: true });
}

/**
 * Normalize Arabic text for forgiving search: strip tashkīl (diacritics) and
 * tatweel, and unify the letter shapes users commonly type interchangeably
 * (alef forms → ا, alef maqsura → ي, taa marbuta → ه). Latin text is lowercased
 * so English-name/email search keeps working too. Returns a comparison key, not
 * display text.
 */
export function normalizeForSearch(input: string): string {
  return input
    .replace(/[ً-ٰٟ]/g, "") // tashkīl + superscript alef
    .replace(/ـ/g, "") // tatweel
    .replace(/[آأإ]/g, "ا") // آ أ إ → ا
    .replace(/ى/g, "ي") // ى → ي
    .replace(/ة/g, "ه") // ة → ه
    .toLowerCase()
    .trim();
}
