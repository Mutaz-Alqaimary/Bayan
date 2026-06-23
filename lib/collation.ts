/**
 * Arabic-aware collation and search helpers (shared across features — the
 * students roster and the reading-content tables both need correct Arabic
 * ordering/search that Postgres' default collation can't reliably provide, so
 * sorting/filtering happens client-side over a loaded list).
 *
 * Framework-agnostic.
 */

/**
 * A locale-aware collator for ordering text. `sensitivity: "base"` ignores case
 * and diacritics; `numeric` orders embedded numbers naturally. Correct for
 * Arabic and English alike.
 */
export function makeNameCollator(locale: string): Intl.Collator {
  return new Intl.Collator(locale, { sensitivity: "base", numeric: true });
}

/**
 * Normalize Arabic text for forgiving search: strip tashkīl (diacritics) and
 * tatweel, and unify the letter shapes users commonly type interchangeably
 * (alef forms → ا, alef maqsura → ي, taa marbuta → ه). Latin text is lowercased
 * so English/email search keeps working too. Returns a comparison key, not
 * display text.
 */
export function normalizeForSearch(input: string): string {
  return input
    .replace(/[ً-ٰٟ]/g, "") // tashkīl + superscript alef
    .replace(/ـ/g, "") // tatweel
    .replace(/[آأإ]/g, "ا") // آ أ إ → ا
    .replace(/ى/g, "ي") // ى → ي
    .replace(/ة/g, "ه") // ة → ه
    .toLowerCase()
    .trim();
}
